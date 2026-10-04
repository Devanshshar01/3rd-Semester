import './style.css'
import { initializeInfrastructure } from './auth'
import { COLORS, duration, escapeHtml, readData, today, uid, writeData, type AppData, type View } from './store'
import { footer, header, icon } from './ui'
import { bankView, reviewView } from './views'
import { learningPathsView } from './learning-path-view'
import { homeView } from './dashboard'
import { notesView, planView } from './organizer-views'

const root = document.querySelector<HTMLElement>('#app')
if (!root) throw new Error('App mount element #app was not found.')
const data: AppData = readData()
let filter = 'all', search = '', timerStarted = 0, timerSubject = '', timerHandle = 0, practiceQuestion = ''
let modal: { kind: 'subject' | 'question' | 'session' | 'task' | 'note'; id?: string } | null = null
let noteSearch = ''
function toast(message: string) { const node = document.querySelector<HTMLElement>('#toast'); if (node) { node.textContent = message; node.classList.add('toast-visible'); window.setTimeout(() => node.classList.remove('toast-visible'), 2400) } }
function render() { root!.innerHTML = `${header(data)}<div class="view-content">${data.view === 'overview' ? homeView(data, Boolean(timerStarted), timerSubject) : data.view === 'subjects' ? learningPathsView(data) : data.view === 'questions' ? bankView(data, filter, search) : data.view === 'review' ? reviewView(data, practiceQuestion) : data.view === 'plan' ? planView(data) : notesView(data, noteSearch)}</div>${footer()}${modalMarkup()}`; if (timerStarted) tick() }
function setView(view: View) { data.view = view; writeData(data); render(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
function modalMarkup() {
 if (!modal) return ''
 const state = modal, kind = state.kind, subject = data.subjects.find(item => item.id === state.id)
 const existingNote = kind === 'note' ? data.notes.find(note => note.id === state.id) : undefined
 const title = kind === 'subject' ? subject ? 'Edit learning path' : 'Create a learning path' : kind === 'question' ? 'Save a practice question' : kind === 'session' ? 'Log learning time' : kind === 'task' ? 'Add a next step' : existingNote ? 'Edit note' : 'Write a note'
 const subjects = data.subjects.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === (kind === 'session' ? state.id : kind === 'note' ? existingNote?.subjectId : data.subjects[0]?.id) ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')
 const optionalPath = `<label>Learning path (optional)<select name="subjectId"><option value="">Personal / no path</option>${subjects}</select></label>`
 const content = kind === 'subject' ? `<label>Name<input name="name" required maxlength="80" value="${escapeHtml(subject?.name ?? '')}" autofocus></label><label>Optional label<input name="code" maxlength="12" value="${escapeHtml(subject?.code ?? '')}" placeholder="e.g. personal project"></label><label>Flexible time goal (minutes)<input name="goal" type="number" min="1" max="100000" value="${subject?.goal ?? 300}" required></label>` : kind === 'question' ? `<label>Learning path (optional)<select name="subjectId"><option value="">Personal practice</option>${subjects}</select></label><label>Question<textarea name="text" required maxlength="1200" rows="3"></textarea></label><label>Topic<input name="topic" maxlength="80"></label><label>Answer<textarea name="answer" maxlength="1200" rows="3"></textarea></label><label>Choices (optional, one per line)<textarea name="options" maxlength="1000" rows="3" placeholder="Choice A&#10;Choice B"></textarea></label>` : kind === 'session' ? `<label>Learning path (optional)<select name="subjectId"><option value="">Personal learning</option>${subjects}</select></label><label>Minutes spent<input name="minutes" type="number" min="1" max="1440" value="25" required></label><label>What did you work on? (optional)<input name="note" maxlength="120"></label>` : kind === 'task' ? `<label>Next step<input name="title" required maxlength="120" autofocus placeholder="e.g. Read about a new topic"></label>${optionalPath}<label>Due date (optional)<input name="due" type="date"></label>` : `<label>Title<input name="title" required maxlength="100" value="${escapeHtml(existingNote?.title ?? '')}" autofocus placeholder="A useful thing to remember"></label>${optionalPath}<label>Your note<textarea name="content" maxlength="6000" rows="8" placeholder="Write freely…">${escapeHtml(existingNote?.content ?? '')}</textarea></label>`
 return `<div class="modal-backdrop" data-action="close-modal"><section class="form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><button type="button" class="icon-button modal-close" data-action="close-modal" aria-label="Close">${icon('close')}</button><h2 id="form-title">${title}</h2><form id="entry-form" data-kind="${kind}">${content}<div class="modal-actions"><button type="button" class="button button-soft" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Save</button></div></form></section></div>`
}
function openSubject(id = '') { modal = { kind: 'subject', id }; render(); document.querySelector<HTMLInputElement>('[name="name"]')?.focus() }
function openNote(id = '') { modal = { kind: 'note', id }; render(); document.querySelector<HTMLInputElement>('[name="title"]')?.focus() }
function addQuestion() { modal = { kind: 'question' }; render(); document.querySelector<HTMLTextAreaElement>('[name="text"]')?.focus() }
function recordSession(subjectId: string, minutes: number, note: string) { const subject = data.subjects.find(s => s.id === subjectId); if (subject) subject.minutes += minutes; data.sessions.push({ id: uid(), subjectId, date: today(), minutes, note }); writeData(data); render() }
function logTime(subjectId = '') { modal = { kind: 'session', id: subjectId || data.subjects[0]?.id || '' }; render() }
function handleForm(form: HTMLFormElement) {
 const values = new FormData(form), value = (key: string) => String(values.get(key) ?? '').trim(), kind = form.dataset.kind
 if (kind === 'subject') { const name = value('name'), goal = Number(value('goal')), existing = data.subjects.find(s => s.id === modal?.id); if (!name || !Number.isInteger(goal) || goal < 1) return; if (existing) Object.assign(existing, { name, code: value('code'), goal }); else data.subjects.push({ id: uid(), name, code: value('code'), goal, color: COLORS[data.subjects.length % COLORS.length]!, minutes: 0 }); modal = null; writeData(data); render(); toast(existing ? 'Learning path updated.' : 'Learning path created.'); return }
 if (kind === 'question') { const text = value('text'), subjectId = value('subjectId'); if (!text || (subjectId && !data.subjects.some(s => s.id === subjectId))) return; data.questions.unshift({ id: uid(), subjectId, text, answer: value('answer'), options: value('options').split(/\r?\n/).map(x => x.trim()).filter(Boolean), difficulty: 'Medium', topic: value('topic'), due: today(), reviews: 0 }); modal = null; writeData(data); render(); toast('Question saved.'); return }
 if (kind === 'session') { const minutes = Number(value('minutes')), subjectId = value('subjectId'); if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440 || (subjectId && !data.subjects.some(item => item.id === subjectId))) return; modal = null; recordSession(subjectId, minutes, value('note')); toast(`${duration(minutes)} logged.`); return }
 if (kind === 'task') { const title = value('title'); if (!title) return; data.tasks.push({ id: uid(), title, subjectId: value('subjectId'), due: value('due'), done: false }); modal = null; writeData(data); render(); toast('Next step added.'); return }
 if (kind === 'note') { const title = value('title'); if (!title) return; const existing = data.notes.find(note => note.id === modal?.id); if (existing) Object.assign(existing, { title, content: value('content'), subjectId: value('subjectId'), updated: today() }); else data.notes.unshift({ id: uid(), title, content: value('content'), subjectId: value('subjectId'), updated: today() }); modal = null; writeData(data); render(); toast(existing ? 'Note updated.' : 'Note saved on this device.') }
}
function startTimer() { const select = document.querySelector<HTMLSelectElement>('#focus-subject'); if (!select?.value) return; timerSubject = select.value; timerStarted = Date.now(); timerHandle = window.setInterval(tick, 1000); render() }
function tick() { const node = document.querySelector<HTMLElement>('#timer-clock'); if (!node || !timerStarted) return; const seconds = Math.floor((Date.now() - timerStarted) / 1000); node.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` }
function stopTimer() { if (!timerStarted) return; const minutes = Math.max(1, Math.round((Date.now() - timerStarted) / 60000)); window.clearInterval(timerHandle); timerStarted = 0; recordSession(timerSubject, minutes, 'Focus session'); toast(`${duration(minutes)} session saved.`) }
function practice(id: string) { practiceQuestion = id; setView('review') }
function review(id: string, tomorrow: boolean) { const q = data.questions.find(x => x.id === id); if (!q) return; q.reviews += 1; q.due = new Date(Date.now() + (tomorrow ? 1 : Math.min(30, q.reviews * 2 + 1)) * 86400000).toISOString().slice(0, 10); practiceQuestion = ''; writeData(data); render(); toast(tomorrow ? 'Scheduled for tomorrow.' : 'Review scheduled.') }
function handleAction(action: string, id = '') {
 switch (action) {
  case 'add-subject': openSubject(); break
  case 'edit-subject': openSubject(id); break
  case 'add-question': addQuestion(); break
  case 'add-task': modal = { kind: 'task' }; render(); document.querySelector<HTMLInputElement>('[name="title"]')?.focus(); break
  case 'add-note': openNote(); break
  case 'edit-note': openNote(id); break
  case 'toggle-task': { const task = data.tasks.find(item => item.id === id); if (task) { task.done = !task.done; writeData(data); render(); toast(task.done ? 'Step completed.' : 'Step reopened.') } break }
  case 'delete-task': data.tasks = data.tasks.filter(task => task.id !== id); writeData(data); render(); toast('Task removed.'); break
  case 'delete-note': data.notes = data.notes.filter(note => note.id !== id); writeData(data); render(); toast('Note deleted.'); break
  case 'log-time': logTime(id); break
  case 'start-timer': startTimer(); break
  case 'stop-timer': stopTimer(); break
  case 'practice': practice(id); break
  case 'review-done': review(id, false); break
  case 'review-later': review(id, true); break
  case 'go-questions': practiceQuestion = ''; setView('questions'); break
  case 'delete-subject': if (window.confirm('Delete this learning path and its practice questions and sessions? Linked tasks and notes will stay as personal items.')) { data.subjects = data.subjects.filter(x => x.id !== id); data.questions = data.questions.filter(x => x.subjectId !== id); data.sessions = data.sessions.filter(x => x.subjectId !== id); data.tasks.forEach(task => { if (task.subjectId === id) task.subjectId = '' }); data.notes.forEach(note => { if (note.subjectId === id) note.subjectId = '' }); writeData(data); render(); toast('Learning path removed.') } break
  case 'delete-question': data.questions = data.questions.filter(x => x.id !== id); writeData(data); render(); toast('Question deleted.'); break
 }
}
root.addEventListener('submit', event => { const form = event.target; if (form instanceof HTMLFormElement && form.id === 'entry-form') { event.preventDefault(); if (form.reportValidity()) handleForm(form) } })
root.addEventListener('click', event => {
 const target = event.target as HTMLElement
 if (target.classList.contains('modal-backdrop') || target.closest('button[data-action="close-modal"]')) { modal = null; render(); return }
 const nav = target.closest<HTMLElement>('[data-view]')
 if (nav?.dataset.view) { practiceQuestion = ''; if (nav.dataset.view !== 'notes') noteSearch = ''; setView(nav.dataset.view as View); return }
 const chip = target.closest<HTMLElement>('[data-filter]')
 if (chip?.dataset.filter) { filter = chip.dataset.filter; render(); return }
 const action = target.closest<HTMLElement>('[data-action]')
 if (action?.dataset.action) handleAction(action.dataset.action, action.dataset.id)
})
root.addEventListener('input', event => { const target = event.target as HTMLInputElement; if (target.id === 'question-search' || target.id === 'note-search') { if (target.id === 'note-search') noteSearch = target.value; else search = target.value; const id = target.id, position = target.selectionStart; render(); const input = document.querySelector<HTMLInputElement>(`#${id}`); input?.focus(); input?.setSelectionRange(position, position) } })
root.addEventListener('change', event => { const target = event.target as HTMLSelectElement; if (target.id === 'subject-filter') { filter = target.value; render() } })
window.addEventListener('hashchange', () => { const view = location.hash.slice(1); if (['overview', 'subjects', 'questions', 'review', 'plan', 'notes'].includes(view)) setView(view as View) })
window.addEventListener('storage', event => { if (event.key === 'sem3-command-center-v1') { Object.assign(data, readData()); render() } })
render()
void initializeInfrastructure()
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Offline support could not be enabled.', error)) })
