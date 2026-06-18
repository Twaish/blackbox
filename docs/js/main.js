function setupCopyright() {
  const copyright = document.querySelector('.footer-copyright')
  copyright.innerHTML = `&copy; ${new Date().getFullYear()} Blackbox. Open Source Project.`
}

function setupFadeAnimation() {
  const fadeElements = document.querySelectorAll('.fade-in-on-scroll')
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  }

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('appear')
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  fadeElements.forEach((el) => observer.observe(el))
}

function setupShowcaseCarousel() {
  const tabBtns = document.querySelectorAll('.tab-btn')
  const showcasePanels = document.querySelectorAll('.showcase-panel')

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab')

      tabBtns.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')

      showcasePanels.forEach((panel) => {
        if (panel.id === `panel-${targetTab}`) {
          panel.classList.add('active')
        } else {
          panel.classList.remove('active')
        }
      })
    })
  })
}

function setupFaqQuestions() {
  const faqQuestions = document.querySelectorAll('.faq-question')

  faqQuestions.forEach((question) => {
    question.addEventListener('click', () => {
      const item = question.parentElement
      const isActive = item.classList.contains('active')

      // Close all other items
      document.querySelectorAll('.faq-item').forEach((el) => {
        el.classList.remove('active')
        const ans = el.querySelector('.faq-answer')
        if (ans) ans.style.maxHeight = '0px'
      })

      if (!isActive) {
        item.classList.add('active')
        const answer = item.querySelector('.faq-answer')
        if (answer) {
          // Set to scrollHeight to animate correctly
          answer.style.maxHeight = answer.scrollHeight + 'px'
        }
      }
    })
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger')
  const navLinks = document.querySelector('.nav-links')

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      let drawer = document.querySelector('.mobile-drawer')
      if (!drawer) {
        drawer = document.createElement('div')
        drawer.className = 'mobile-drawer'
        drawer.style.position = 'fixed'
        drawer.style.top = '80px'
        drawer.style.left = '0'
        drawer.style.width = '100%'
        drawer.style.height = 'calc(100vh - 80px)'
        drawer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
        drawer.style.backdropFilter = 'blur(10px)'
        drawer.style.zIndex = '99'
        drawer.style.display = 'flex'
        drawer.style.flexDirection = 'column'
        drawer.style.alignItems = 'center'
        drawer.style.justifyContent = 'center'
        drawer.style.gap = '24px'
        drawer.style.opacity = '0'
        drawer.style.transition = 'opacity 0.3s ease'
        drawer.style.pointerEvents = 'none'

        const links = document.querySelectorAll('.nav-links a')
        links.forEach((link) => {
          const clone = link.cloneNode(true)
          clone.style.fontSize = '1.3rem'
          clone.style.fontWeight = '600'
          clone.addEventListener('click', () => {
            closeDrawer()
          })
          drawer.appendChild(clone)
        })

        document.body.appendChild(drawer)
      }

      const isOpen = hamburger.classList.toggle('active')
      if (isOpen) {
        hamburger.children[0].style.transform = 'translateY(8px) rotate(45deg)'
        hamburger.children[1].style.opacity = '0'
        hamburger.children[2].style.transform =
          'translateY(-8px) rotate(-45deg)'
        drawer.style.opacity = '1'
        drawer.style.pointerEvents = 'auto'
        document.body.style.overflow = 'hidden'
      } else {
        closeDrawer()
      }

      function closeDrawer() {
        hamburger.classList.remove('active')
        hamburger.children[0].style.transform = 'none'
        hamburger.children[1].style.opacity = '1'
        hamburger.children[2].style.transform = 'none'
        drawer.style.opacity = '0'
        drawer.style.pointerEvents = 'none'
        document.body.style.overflow = ''
      }
    })
  }

  setupCopyright()
  setupFadeAnimation()
  setupShowcaseCarousel()
  setupFaqQuestions()
})
