<template>
  <div class="default-shell">
    <header class="default-header">
      <div class="default-header__inner">
        <AgriBrand to="/" :size="40" tagline="Gestion agricole" variant="png" />

        <nav class="default-nav" aria-label="Navigation principale">
          <NuxtLink class="default-nav__link" to="/#services">Services</NuxtLink>
          <NuxtLink class="default-nav__link" to="/auth/login">Connexion</NuxtLink>
          <NuxtLink to="/auth/register" class="default-nav__cta">
            <v-btn color="primary" size="small" rounded="lg" elevation="1">
              Créer un compte
            </v-btn>
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="default-main">
      <slot />
    </main>

    <footer class="default-footer">
      <div class="default-footer__inner">
        <AgriBrand to="/" :size="32" :show-name="true" variant="svg" />
        <p class="default-footer__copy">
          © {{ year }} AgriManage — Plateforme professionnelle de gestion de ferme.
        </p>
        <div class="default-footer__links">
          <NuxtLink to="/auth/login">Se connecter</NuxtLink>
          <NuxtLink to="/auth/register">Créer un compte</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<style scoped>
.default-shell {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background:
    radial-gradient(ellipse 70% 40% at 10% -5%, rgba(64, 145, 108, 0.12), transparent 55%),
    radial-gradient(ellipse 50% 35% at 100% 0%, rgba(212, 163, 115, 0.1), transparent 50%),
    var(--agri-page);
}

.default-header {
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--agri-border);
  background: rgba(244, 250, 246, 0.85);
  backdrop-filter: blur(12px);
}

.default-header__inner {
  margin: 0 auto;
  display: flex;
  max-width: 1100px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
}

.default-nav {
  display: flex;
  align-items: center;
  gap: 0.35rem 1rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.default-nav__link {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--agri-muted);
  text-decoration: none;
  transition: color 0.2s ease;
}

.default-nav__link:hover,
.default-nav__link.router-link-active {
  color: var(--agri-forest);
}

.default-nav__cta {
  text-decoration: none;
}

.default-main {
  flex: 1;
  width: 100%;
}

.default-footer {
  margin-top: auto;
  border-top: 1px solid var(--agri-border);
  background: linear-gradient(180deg, rgba(233, 245, 238, 0.65), rgba(27, 67, 50, 0.04));
}

.default-footer__inner {
  margin: 0 auto;
  display: flex;
  max-width: 1100px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
}

.default-footer__copy {
  margin: 0;
  flex: 1 1 220px;
  font-size: 0.8rem;
  color: var(--agri-muted);
}

.default-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8rem;
}

.default-footer__links a {
  color: var(--agri-green);
  text-decoration: none;
  font-weight: 500;
}

.default-footer__links a:hover {
  color: var(--agri-forest);
  text-decoration: underline;
}

@media (max-width: 640px) {
  .default-header__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .default-nav {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
