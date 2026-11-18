# Cadeira · site

SaaS de agendamento para barbearias, feito com Next.js e TypeScript.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # testes das regras de horário
npm run typecheck  # checagem de tipos
npm run lint
```

## Páginas

| URL | Tela |
| --- | --- |
| `/` | Página do produto |
| `/dom-navalha` | Início do cliente |
| `/dom-navalha/servicos` | Serviços (passo 1) |
| `/dom-navalha/agendar/profissional` | Escolha do profissional (passo 2) |
| `/dom-navalha/agendar/horario` | Data e horário (passo 3) |
| `/dom-navalha/agendamento/[id]` | Confirmação, calendário e cancelamento |
| `/dom-navalha/agenda` | Próximos horários do cliente |
| `/dom-navalha/perfil` | Perfil, fidelidade e histórico |
| `/dom-navalha/admin` | Painel do administrador |

Cada barbearia tem seu endereço (`/<slug>`), o que permite várias barbearias no mesmo sistema.

## Organização

```text
src/
  lib/
    tipos.ts             tipos do domínio (Barbearia, Servico, Agendamento...)
    disponibilidade.ts   regra dos horários livres (com testes)
    metricas.ts          números do painel
    repositorio.ts       acesso aos dados (o único arquivo que muda com o Supabase)
    dados-exemplo.ts     dados falsos gerados em volta da data de hoje
    datas.ts, dinheiro.ts  formatação em pt-BR
  components/            peças visuais reaproveitadas
  app/                   páginas (App Router)
```

## Limitações atuais

- **Os dados ficam em memória**: reiniciar o servidor apaga os agendamentos novos.
- **Ainda não tem login**: todo visitante é o cliente de exemplo "Rafael Souza", e o `/admin` é aberto.
- Lembrete por WhatsApp, reagendamento e as abas Agenda/Clientes/Equipe do admin ainda não existem.
# Saas-barbearia
# Saas-barbearia
