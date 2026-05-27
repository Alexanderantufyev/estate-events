import type { RevenueData, ExpenseData, FinancialMetrics } from '../types'

export function calculateRevenue(revenue: RevenueData): number {
  return (
    revenue.ticketPrice * revenue.ticketsSold +
    revenue.sponsors +
    revenue.additionalIncome +
    revenue.bar +
    revenue.merch
  )
}

export function calculateExpenses(expenses: ExpenseData): number {
  return (
    expenses.venue +
    expenses.advertising +
    expenses.staff +
    expenses.artists +
    expenses.equipment +
    expenses.catering +
    expenses.transport +
    expenses.taxes +
    expenses.other
  )
}

export function calculateMetrics(
  revenue: RevenueData,
  expenses: ExpenseData
): FinancialMetrics {
  const totalRevenue = calculateRevenue(revenue)
  const totalExpenses = calculateExpenses(expenses)
  const netProfit = totalRevenue - totalExpenses

  const roi =
    totalExpenses > 0 ? ((totalRevenue - totalExpenses) / totalExpenses) * 100 : 0

  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  const breakeven =
    revenue.ticketPrice > 0 ? Math.ceil(totalExpenses / revenue.ticketPrice) : 0

  const profitPerAttendee =
    revenue.ticketsSold > 0 ? netProfit / revenue.ticketsSold : 0

  let profitability: FinancialMetrics['profitability']
  if (netProfit > 0 && roi > 10) {
    profitability = 'profitable'
  } else if (netProfit < 0) {
    profitability = 'loss'
  } else {
    profitability = 'risk'
  }

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    roi,
    margin,
    breakeven,
    profitPerAttendee,
    profitability,
  }
}
