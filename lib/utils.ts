import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isBefore, subHours } from 'date-fns'
import { es } from 'date-fns/locale'
import type { PredictedWinner } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: es })
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), "dd/MM HH:mm", { locale: es })
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function isMatchLocked(matchDate: string): boolean {
  return isBefore(new Date(matchDate), subHours(new Date(), -1))
  // locked if match starts in less than 1 hour from now
}

export function isMatchLockedStrict(matchDate: string): boolean {
  const lockTime = subHours(new Date(matchDate), 1)
  return isBefore(lockTime, new Date())
}

export function getWinnerLabel(winner: PredictedWinner, home: string, away: string): string {
  if (winner === 'home') return home
  if (winner === 'away') return away
  return 'Empate'
}

export function determineWinner(home: number, away: number): PredictedWinner {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

export function getRankChange(current: number, prev: number | null): 'up' | 'down' | 'same' | 'new' {
  if (prev === null) return 'new'
  if (current < prev) return 'up'
  if (current > prev) return 'down'
  return 'same'
}

export function formatScore(home: number | null, away: number | null): string {
  if (home === null || away === null) return '- : -'
  return `${home} : ${away}`
}

export function getAccuracy(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 100)
}

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@prode2026.app`
}

export function emailToUsername(email: string): string {
  return email.replace('@prode2026.app', '')
}

export const FLAG_BASE = 'https://flagcdn.com/w40'

export const TEAM_FLAGS: Record<string, string> = {
  // Se mapean los nombres de equipos a códigos ISO-2 de países
  'Argentina': 'ar', 'Brasil': 'br', 'Uruguay': 'uy', 'Colombia': 'co',
  'Ecuador': 'ec', 'Venezuela': 've', 'Bolivia': 'bo', 'Paraguay': 'py',
  'Chile': 'cl', 'Perú': 'pe', 'México': 'mx', 'USA': 'us',
  'Canadá': 'ca', 'Costa Rica': 'cr', 'Honduras': 'hn', 'Guatemala': 'gt',
  'Panamá': 'pa', 'El Salvador': 'sv', 'Jamaica': 'jm', 'Trinidad y Tobago': 'tt',
  'Francia': 'fr', 'Alemania': 'de', 'España': 'es', 'Portugal': 'pt',
  'Inglaterra': 'gb-eng', 'Italia': 'it', 'Países Bajos': 'nl', 'Bélgica': 'be',
  'Croacia': 'hr', 'Serbia': 'rs', 'Suiza': 'ch', 'Dinamarca': 'dk',
  'Austria': 'at', 'Polonia': 'pl', 'Escocia': 'gb-sct', 'Turquía': 'tr',
  'Marruecos': 'ma', 'Senegal': 'sn', 'Nigeria': 'ng', 'Camerún': 'cm',
  'Ghana': 'gh', 'Costa de Marfil': 'ci', 'Egipto': 'eg', 'Mali': 'ml',
  'Japón': 'jp', 'Corea del Sur': 'kr', 'Australia': 'au', 'Irán': 'ir',
  'Arabia Saudita': 'sa', 'Qatar': 'qa', 'China': 'cn', 'Indonesia': 'id',
  'Nueva Zelanda': 'nz',
}

export function getFlagUrl(team: string): string {
  const code = TEAM_FLAGS[team]
  if (!code) return ''
  return `${FLAG_BASE}/${code}.png`
}
