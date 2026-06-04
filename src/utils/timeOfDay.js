/**
 * Período del día para iluminación de la pantalla de carga.
 * morning   05:00 – 11:59  claro y luminoso
 * afternoon 12:00 – 17:59  cálido, algo más opaco
 * evening   18:00 – 20:59  atardecer
 * night     21:00 – 04:59  oscuro, estrellas
 */
export function getTimeOfDayPeriod(date = new Date()) {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 21) return 'evening'
  return 'night'
}

export function getAuthTimeConfig(date = new Date()) {
  const period = getTimeOfDayPeriod(date)

  const labels = {
    morning: 'Buenos días',
    afternoon: 'Buenas tardes',
    evening: 'Buen atardecer',
    night: 'Buenas noches',
  }

  return {
    period,
    greeting: labels[period],
    showStars: period === 'evening' || period === 'night',
  }
}
