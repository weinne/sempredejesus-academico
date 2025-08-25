import { test, expect } from '@playwright/test';

async function ensureAdminAndLogin(page: any) {
  await page.goto('/login');
  // Try to detect bootstrap screen
  const bootstrapTitle = page.locator('text=Configurar Administrador Inicial');
  if (await bootstrapTitle.isVisible().catch(() => false)) {
    await page.getByLabel('Nome completo').fill('Admin');
    await page.getByLabel('Email').fill('admin@seminario.edu');
    await page.getByLabel('Senha').fill('admin123');
    await page.getByRole('button', { name: /criar administrador/i }).click();
  } else {
    await page.getByLabel(/Email ou usuário/i).fill('admin@seminario.edu');
    await page.getByLabel(/Senha/i).fill('admin123');
    await page.getByRole('button', { name: /entrar/i }).click();
  }
  await page.waitForURL(/dashboard/);
}

test('cria aluno com pessoa e usuário (inline)', async ({ page }) => {
  await ensureAdminAndLogin(page);

  // Garantir que exista ao menos um curso
  await page.goto('/cursos');
  await page.getByRole('button', { name: /novo curso/i }).click();
  // Preencher campos via placeholder e ordem (labels não estão associados aos inputs)
  await page.getByPlaceholder('Ex: Bacharelado em Teologia').fill('Curso Teste');
  await page.locator('select').first().selectOption('BACHARELADO');
  await page.getByRole('button', { name: /criar/i }).click();
  // Aguardar confirmação visual do curso criado
  await expect(page.locator('text=Curso criado').first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text=Curso Teste').first()).toBeVisible({ timeout: 15000 });

  // Ir para alunos
  await page.goto('/alunos');
  // Abrir formulário de matrícula
  await page.getByRole('button', { name: /nova matrícula/i }).click();
  // Esperar cursos carregarem no select
  const cursoSelect = page.locator('label:has-text("Curso") + select');
  await expect(cursoSelect).toBeVisible({ timeout: 15000 });
  // aguarda opção do curso
  await page.waitForSelector('select >> text=Curso Teste', { timeout: 15000 });

  // Abrir formulário
  await page.getByRole('button', { name: /nova matrícula/i }).click();

  // Pessoa inline marcada por padrão: preencher campos mínimos via rótulos -> próximo input/select
  await page.locator('label:has-text("Nome Completo") + input').fill('Aluno Teste');
  await page.locator('label:has-text("Sexo") + select').selectOption('M');
  await page.locator('label:has-text("Email") + input').fill('aluno.teste@example.com');

  // Dados da matrícula
  await page.locator('label:has-text("Curso") + select').selectOption({ label: /Curso Teste/i });
  const ano = new Date().getFullYear().toString();
  await page.locator('label:has-text("Ano de Ingresso") + input').fill(ano);
  await page.locator('label:has-text("Situação") + select').selectOption('ATIVO');

  // Criar usuário (já marcado por padrão)
  await page.locator('label:has-text("Username") + input').fill('aluno.teste');
  await page.locator('label:has-text("Senha") + div >> input').fill('test123');

  await page.getByRole('button', { name: /matricular/i }).click();

  // Sucesso: toast ou card com nome na lista
  const toast = page.locator('text=Aluno criado');
  const toastDesc = page.locator('text=Aluno e usuário criados com sucesso');
  const cardName = page.locator('text=Aluno Teste');
  await Promise.race([
    toast.waitFor({ state: 'visible', timeout: 15000 }),
    toastDesc.waitFor({ state: 'visible', timeout: 15000 }),
    cardName.waitFor({ state: 'visible', timeout: 15000 }),
  ]);
});


