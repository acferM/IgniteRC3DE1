export function formatDate(date: string): string {
  const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const withoutFirstDate = formattedDate.replace('de', '');
  const withoutSecondDate = withoutFirstDate.replace('de', '');
  const finalDate = withoutSecondDate.replace('.', '');

  return finalDate;
}
