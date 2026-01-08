export default function formatAIResponse(data) {
  let text = "";

  text += `❌ What went wrong\n${data.rootCause}\n\n`;

  if (data.location?.file) {
    text += `📍 Location\n${data.location.file}:${data.location.line}\n\n`;
  }

  data.fixes.forEach((fix, index) => {
    text += `✅ Fix ${index + 1} (${fix.type})\n`;
    text += `Code:\n${fix.patch}\n\n`;
    text += `Explanation:\n${fix.explanation.beginner}\n\n`;
    text += `Confidence: ${(fix.confidence * 100).toFixed(0)}%\n\n`;
  });

  if (data.diagnosticSteps?.length) {
    text += `🧪 Diagnostic Steps\n`;
    data.diagnosticSteps.forEach(step => {
      text += `- ${step}\n`;
    });
    text += `\n`;
  }

  if (data.followUpQuestions?.length) {
    text += `❓ Follow-up Questions\n`;
    data.followUpQuestions.forEach(q => {
      text += `- ${q}\n`;
    });
  }

  return text;
}
