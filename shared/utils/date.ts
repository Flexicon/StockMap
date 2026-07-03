const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/

export function localDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function daysBetweenLocalDates(fromDate: string, toDate: string): number {
  if (!dateOnlyPattern.test(fromDate) || !dateOnlyPattern.test(toDate)) {
    throw new Error('Expected YYYY-MM-DD date strings')
  }

  const [fromYear, fromMonth, fromDay] = parseLocalDateParts(fromDate)
  const [toYear, toMonth, toDay] = parseLocalDateParts(toDate)
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay)
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay)

  return Math.floor((toUtc - fromUtc) / 86_400_000)
}

function parseLocalDateParts(date: string): [number, number, number] {
  const [year, month, day] = date.split('-').map(Number)

  if (year === undefined || month === undefined || day === undefined) {
    throw new Error('Expected YYYY-MM-DD date strings')
  }

  return [year, month, day]
}

export function relativeVisitAge(visitedOn: string | null, today = localDateString()): string {
  if (!visitedOn) return 'Never'

  const days = daysBetweenLocalDates(visitedOn, today)

  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'

  return `${days} days`
}
