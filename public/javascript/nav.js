document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname

    document.querySelectorAll('.bottom-nav a').forEach(link => {
        if (
            link.getAttribute('href') === currentPath &&
            !link.classList.contains('no-active')
        ) {
            link.classList.add('active')
        }
    })
})