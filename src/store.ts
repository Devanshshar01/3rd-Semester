export type Subject = { id: string; name: string; code: string; color: string; goal: number; minutes: number }
export type Question = { id: string; subjectId: string; text: string; answer: string; options: string[]; difficulty: string; topic: string; due: string; reviews: number }
export type Session = { id: string; subjectId: string; date: string; minutes: number; note: string }
export type Task = { id: string; title: string; subjectId: string; due: string; done: boolean }
export type Note = { id: string; title: string; content: string; subjectId: string; updated: string }
export type View = 'overview' | 'subjects' | 'questions' | 'review' | 'plan' | 'notes'
export type AppData = { subjects: Subject[]; questions: Question[]; sessions: Session[]; tasks: Task[]; notes: Note[]; view: View }
export const STORAGE_KEY = 'sem3-command-center-v1'
export const COLORS = ['#466d54', '#68729b', '#a66c47', '#458087', '#986481', '#89803c']
export const today = () => new Date().toISOString().slice(0, 10)
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
export const initialData: AppData = { subjects: [], questions: [], sessions: [], tasks: [], notes: [], view: 'overview' }
export function readData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { ...initialData }
    const value = JSON.parse(saved) as Partial<AppData>
    return {
      subjects: Array.isArray(value.subjects) ? value.subjects.filter(x => x && typeof x.id === 'string' && typeof x.name === 'string').map(x => ({ id: x.id, name: x.name, code: x.code ?? '', color: x.color ?? COLORS[0], goal: Math.max(1, Number(x.goal) || 300), minutes: Math.max(0, Number(x.minutes) || 0) })) : [],
      questions: Array.isArray(value.questions) ? value.questions.filter(x => x && typeof x.id === 'string' && typeof x.text === 'string').map(x => ({ id: x.id, subjectId: x.subjectId ?? '', text: x.text, answer: x.answer ?? '', options: Array.isArray(x.options) ? x.options : [], difficulty: x.difficulty ?? 'Medium', topic: x.topic ?? '', due: x.due ?? today(), reviews: Math.max(0, Number(x.reviews) || 0) })) : [],
      sessions: Array.isArray(value.sessions) ? value.sessions.filter(x => x && typeof x.id === 'string').map(x => ({ id: x.id, subjectId: x.subjectId ?? '', date: x.date ?? today(), minutes: Math.max(0, Number(x.minutes) || 0), note: x.note ?? '' })) : [],
      tasks: Array.isArray(value.tasks) ? value.tasks.filter(x => x && typeof x.id === 'string' && typeof x.title === 'string').map(x => ({ id: x.id, title: x.title, subjectId: x.subjectId ?? '', due: x.due ?? '', done: Boolean(x.done) })) : [],
      notes: Array.isArray(value.notes) ? value.notes.filter(x => x && typeof x.id === 'string' && typeof x.title === 'string').map(x => ({ id: x.id, title: x.title, content: x.content ?? '', subjectId: x.subjectId ?? '', updated: x.updated ?? today() })) : [],
      view: ['overview', 'subjects', 'questions', 'review', 'plan', 'notes'].includes(value.view ?? '') ? value.view as View : 'overview'
    }
  } catch { return { ...initialData } }
}
export function writeData(data: AppData): void { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch (error) { console.error('Could not save study data locally.', error) } }
export function duration(minutes: number): string { return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` }
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}
