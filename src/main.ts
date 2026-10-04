import './style.css'

const status = document.querySelector<HTMLElement>('#app-status')

if (status) {
  status.textContent = 'Your workspace is running locally. Set up your subjects to get started.'
}
