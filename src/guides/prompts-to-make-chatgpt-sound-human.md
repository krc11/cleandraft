---
title: "Prompts that make ChatGPT write more naturally"
description: "Copy-and-paste prompts that get a more natural first draft from ChatGPT, Claude or Gemini, and the reasons each one works."
order: 12
published: "2026-11-14"
---

The easiest AI draft to edit is one that started out well. A few lines of instruction can remove a lot of the stiffness before you ever see it. These prompts work with ChatGPT, Claude, Gemini and other assistants.

## Why "sound more human" doesn't work

Asking an assistant to "sound human" or "be less robotic" gives it nothing to act on. It tends to respond by adding chatty filler or exclamation marks. Assistants do much better with specific instructions about the reader, the length and the things to avoid.

## Give it your own writing as a sample

This is the most effective single step. Paste two or three paragraphs you wrote yourself and ask the assistant to match them.

```
Here is a sample of how I write:

[paste 2 or 3 paragraphs of your own writing]

Write the draft in the same voice. Match my sentence length,
my word choice and how formal I am. Don't copy my content.
```

## Tell it who is reading

A named reader changes the tone more than any adjective does.

```
Write this for a busy operations manager who knows the
business well but has no time. They will read it on a phone.
Get to the point in the first sentence.
```

## Ban the stock phrases

Assistants follow a list of things to avoid fairly well in short replies.

```
Style rules:
- Use plain, everyday words. "Use", not "utilize".
- Use contractions such as "don't" and "it's".
- Don't start sentences with "Moreover", "Furthermore" or
  "Additionally".
- Don't use "it is important to note", "plays a crucial role",
  "a wide range of" or "in today's world".
- No em dashes. Use commas or full stops.
- Don't end with a summary of what you just said.
```

## Ask for a view

Assistants hedge by default. Tell it to commit.

```
Give one clear recommendation and say why. Mention the main
downside in one sentence. Don't list pros and cons for every
option.
```

## Give it real material

The biggest cause of generic writing is that the assistant has nothing specific to say. Feed it facts.

```
Use these details in the draft. Don't add facts I haven't
given you. If you need something I haven't provided, write
[NEED: what you need] and carry on.

- We moved to weekly releases in March.
- Support tickets fell from about 90 a week to about 60.
- The team is five people.
```

The `[NEED: ...]` instruction is useful. It makes the assistant leave a visible gap where it would otherwise make something up.

## Set the length

```
Keep it under 150 words. Short paragraphs of one to three
sentences.
```

## A prompt that combines them

```
Write a short update email to my team about the change below.

Reader: five colleagues who know the project.
Voice: match the sample at the end.
Rules: plain words, contractions, no em dashes, no filler
openers, no closing summary. Under 120 words.
Facts: [your facts]
If something is missing, write [NEED: ...].

Sample of my writing: [paste]
```

## What prompts can't fix

Even a good prompt leaves work for you:

- **Facts.** Check every one. Assistants can still state wrong details.
- **Drift.** Over a long reply, assistants tend to slip back into old habits, and banned phrases return.
- **Your experience.** It can only use what you gave it.

That's where editing comes in. Run the draft through the [CleanDraft editor](/) to catch the stock phrases that slipped through, then follow our [step-by-step method](/guides/how-to-humanize-ai-text) for the rest.
