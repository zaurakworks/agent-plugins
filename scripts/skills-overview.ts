#!/usr/bin/env node
// 生成 docs/skills-overview.md：写给负责人的选型面。
//
// 只有三句话是手写的（写在 tests/workflow-routing.json 的 skillOverview 里）：
// 它替你做什么、什么时候用、你怎么知道它在起作用。其余全部推导——版本来自
// pluginVersions，复核状态来自 skillLifecycle，体积与预算占比来自实测字节。
//
// **它是生成产物，不是手写文档。** 符合性测试会重新生成并与文件比对，因此
// 它不可能与来源漂移——这正是 docs/lifecycle.md 要防的东西，选型面自己也得守。
//
// 运行：node scripts/skills-overview.ts --write

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string): string =>
  readFileSync(path, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
const directories = (path: string): string[] =>
  readdirSync(path).filter((entry) => statSync(join(path, entry)).isDirectory());

type Manifest = {
  skills: Record<string, { plugin: string }>;
  pluginVersions: Record<string, string>;
  complexityBudget: { corpusMaxUtf8Bytes: number };
  skillLifecycle: {
    entries: Record<
      string,
      { lastVerified: string | null; suspect: boolean; invalidatedWhen: string }
    >;
  };
  skillOverview: {
    entries: Record<string, { forYou: string; whenToUse: string; workingSignals: string }>;
  };
};

const manifest = JSON.parse(read(join(repoRoot, 'tests', 'workflow-routing.json'))) as Manifest;

/** SKILL.md 加它自己的 references/，与语料预算同一口径。 */
function skillBytes(plugin: string, skill: string): number {
  const root = join(repoRoot, 'plugins', plugin, 'skills', skill);
  let total = Buffer.byteLength(read(join(root, 'SKILL.md')), 'utf8');
  const references = join(root, 'references');
  if (existsSync(references)) {
    for (const file of readdirSync(references)) {
      if (file.endsWith('.md')) total += Buffer.byteLength(read(join(references, file)), 'utf8');
    }
  }
  return total;
}

export function render(): string {
  const budget = manifest.complexityBudget.corpusMaxUtf8Bytes;
  const rows = Object.entries(manifest.skills).map(([skill, spec]) => {
    const bytes = skillBytes(spec.plugin, skill);
    return { skill, plugin: spec.plugin, bytes, share: (bytes / budget) * 100 };
  });
  rows.sort((a, b) => b.bytes - a.bytes);

  const lines: string[] = [
    '<!-- 生成产物：node scripts/skills-overview.ts --write。不要手改；',
    '     三句话的来源是 tests/workflow-routing.json 的 skillOverview。 -->',
    '',
    '# Skill 选型面',
    '',
    '这是给人看的入口：每个 Skill 替你做什么、什么时候会用到、你怎么看出它在起作用，',
    '以及它花掉多少复杂度预算。`SKILL.md` 是给 Agent 执行的行为合同，优先保证触发、硬门、分支和退出完整，不是按顺序阅读的教程；只有维护或审查行为时才需要下钻。',
    '',
    `当前 ${rows.length} 个 Skill，共 ${rows.reduce((s, r) => s + r.bytes, 0).toLocaleString('en-US')} 字节，` +
      `占复杂度预算 ${((rows.reduce((s, r) => s + r.bytes, 0) / budget) * 100).toFixed(1)}%。`,
    '',
    '| Skill | 版本 | 体积 | 占预算 | 上次复核 |',
    '| --- | --- | ---: | ---: | --- |',
  ];
  for (const row of rows) {
    const life = manifest.skillLifecycle.entries[row.skill];
    const verified = life?.suspect
      ? '**存疑**'
      : life?.lastVerified
        ? life.lastVerified
        : '**从未**';
    lines.push(
      `| [${row.skill}](#${row.skill}) | ${manifest.pluginVersions[row.plugin]} | ` +
        `${(row.bytes / 1024).toFixed(1)} KB | ${row.share.toFixed(1)}% | ${verified} |`,
    );
  }
  lines.push('');

  for (const row of rows) {
    const overview = manifest.skillOverview.entries[row.skill];
    const life = manifest.skillLifecycle.entries[row.skill];
    lines.push(
      `## ${row.skill}`,
      '',
      `**它替你做什么** ${overview.forYou}`,
      '',
      `**什么时候用** ${overview.whenToUse}`,
      '',
      `**你怎么知道它在起作用** ${overview.workingSignals}`,
      '',
      `**什么会让它失效** ${life.invalidatedWhen}`,
      '',
      `所属 Plugin \`${row.plugin}\` \`${manifest.pluginVersions[row.plugin]}\`｜` +
        `体积 ${(row.bytes / 1024).toFixed(1)} KB（占预算 ${row.share.toFixed(1)}%）｜` +
        `上次复核 ${life.suspect ? '**存疑**' : (life.lastVerified ?? '**从未**')}｜` +
        `Agent 行为合同（维护／审查时读取）[\`plugins/${row.plugin}/skills/${row.skill}/SKILL.md\`](../plugins/${row.plugin}/skills/${row.skill}/SKILL.md)`,
      '',
    );
  }
  return lines.join('\n');
}

if (process.argv.includes('--write')) {
  const target = join(repoRoot, 'docs', 'skills-overview.md');
  writeFileSync(target, render(), 'utf8');
  console.log(`已生成 ${target}`);
}
