export const SAMPLES = {
  blog: `In today's fast-paced world, content marketing plays a vital role in business growth. Moreover, it is important to note that a wide range of companies utilize blogs in order to reach new readers. Many teams have seen results — sometimes quickly — but they do not always measure them. Furthermore, the vast majority of writers are able to leverage simple tools.

In the first quarter, the team shipped the new product line. It is a robust and comprehensive system, and the company uses it on a daily basis. However, there is no doubt that this requires additional training prior to launch. It works well. It saves time.`,
  email: `I hope this email finds you well. Furthermore, I wanted to provide an update regarding the launch. We are able to commence testing prior to Friday. Please do not hesitate to reach out if you have any questions.`,
  entities: `Moreover, Priya Nair of Acme Corp said 42% of users in order to save $1,200 per month utilize the tool, as "in order to utilize" shows (Smith, 2020). In 2023, the team published the data at https://example.com/a-wide-range-of on March 5, 2024. A wide range of readers contacted info@example.com about the 3.5 million downloads [12].`,
  layout: `# Moreover, a heading in order to stay

Furthermore, this paragraph is able to utilize a wide range of tools in order to work well.

1. Moreover, the first item is able to utilize many tools every single day.
2. The second item is important in order to finish the whole list.

- A bullet that is able to leverage the plan in order to finish.

| in order to | utilize |
| --- | --- |

\`\`\`
in order to utilize
\`\`\``,
};

// A sentence that gives one rule the context its guard expects.
export function ruleCase(rule) {
  const p = rule.pattern;
  if (rule.id.startsWith('op-')) return `${p}, the plan works well for the team.`;
  if (rule.id.startsWith('ad-')) return `This is a ${p} plan for the team.`;
  if (rule.id === 'pl-enable' || rule.id.startsWith('pl-enable-')) return `The tool will ${p} users to work faster every day.`;
  if (rule.id.startsWith('pl-ensure')) return `The team will ${p} that the plan works well.`;
  if (rule.id.startsWith('pl-adhere')) return `The team will ${p} to the plan every day.`;
  if (rule.id.startsWith('pl-objective')) return `We know the ${p} for the team this year.`;
  if (rule.id.startsWith('pl-')) return `The team will ${p} the plan every day this year.`;
  return `The team said that ${p} the plan works well for everyone.`;
}

// Rules fire probabilistically, so each rule's golden case uses the first seed that fires it.
export function firingSeed(humanize, rule, baseId) {
  const text = ruleCase(rule);
  for (let seed = 1; seed <= 40; seed++) {
    if (humanize(text, { strength: 'strong', tone: 'natural', seed }).edits.some((e) => e.rule === baseId)) return seed;
  }
  return null;
}
