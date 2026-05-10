export function buildExtractionPrompt(transcript: string, userName: string): string {
  return `You are a networking assistant. From the conversation transcript below, extract:

1. person: { name, company, role } — best guess if implied; null if unknown
2. takeaways: 3-5 short bullets capturing what's most useful to remember
3. personal: details that humanize them (family, hobbies, interests, recent life events)
4. followups: commitments either side made, or things to do next
5. draftEmail: { subject, body } — a warm, specific thank-you email that references ONE concrete detail from the conversation. Sign it from ${userName}.

Return ONLY valid JSON matching this schema:
{
  "person": { "name": string|null, "company": string|null, "role": string|null },
  "takeaways": string[],
  "personal": string[],
  "followups": string[],
  "draftEmail": { "subject": string, "body": string }
}
No markdown, no commentary.

Transcript:
"""
${transcript}
"""`;
}
