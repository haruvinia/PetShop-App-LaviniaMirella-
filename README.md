# Pet Shop

Aplicativo mobile de demonstração para PAM II. Desenvolvido em React Native com Expo, Firebase Authentication, React Navigation e `expo-notifications`, seguindo `instructions.txt` e o PDF **PAM II - AULA AUTENTICAÇÃO - 2026**.

## Entrega

- Projeto: [PetShop-App-LaviniaMirella- no GitHub](https://github.com/haruvinia/PetShop-App-LaviniaMirella-).
- Integrantes: **Lavínia Harumi Harakawa Manzan** e **Mirella Ferreira Silva**.

Antes de entregar, confira que os arquivos desta implementação foram commitados e enviados ao repositório. Alterações feitas somente no computador não aparecem no link.

## Funcionalidades

- Cadastro com nome, e-mail, senha e confirmação; login real no Firebase; sessão persistente e logout.
- Abas Home, Notificações e Perfil, acessíveis somente após autenticação.
- Agendamentos simulados de banho, tosa e consulta, com nome do pet, data e horário futuros.
- Catálogo com quantidades, total em reais e confirmação de compra simulada, sem cobrança.
- Dois tipos de notificação local: **agendamento confirmado** e **compra simulada confirmada**.
- Histórico de eventos e alertas salvo no celular, separado por usuário.
- Perfil com nome e e-mail da conta Firebase.
- Nome obrigatório para acessar as telas autenticadas; se a gravação do nome falhar, o app solicita completar o cadastro.
- Campos obrigatórios de cada registro local validados antes da leitura e da gravação.
- Histórico limitado às cinco notificações mais recentes; ao adicionar a sexta, a mais antiga é apagada do histórico. Compras e agendamentos são preservados.
- Interface em português com roxo, branco, preto e amarelo.

Somente a autenticação usa a nuvem. Não há agenda de clínica real, pagamentos, entregas ou banco remoto. Limpar o armazenamento ou reinstalar o app pode apagar os dados locais. No Expo Go, os dados pertencem ao ambiente deste projeto.

## Executar no Android com Expo Go

Requisitos: Node.js **22.13 ou superior**, npm e Expo Go compatível com **Expo SDK 57** no Android. React 19.2.3 e React Native 0.86.3 seguem o template SDK 57. [Matriz de versões do Expo](https://docs.expo.dev/versions/latest/).

```powershell
npm install
Copy-Item .env.example .env
```

O `.env.example` já contém a configuração pública do Firebase do grupo. Copiá-lo conecta o app ao projeto existente; não há senhas de usuários nesse arquivo. Se `.env` já existir, preserve seus valores. Depois execute:

```powershell
npm start
```

Abra o Expo Go e escaneie o QR Code. Celular e computador devem estar na mesma rede. Se a rede local bloquear a conexão, tente `npx expo start --tunnel` (pode solicitar a instalação do suporte a túnel).

## Configurar o Firebase existente

1. No [Console do Firebase](https://console.firebase.google.com/), abra o projeto já criado.
2. Em **Configurações do projeto → Geral → Seus apps**, selecione o app **Web (`</>`)**. Se necessário, registre um app Web no projeto existente; não é preciso criar outro projeto ou ativar Hosting.
3. Copie os valores do objeto `firebaseConfig` para `.env`:

| Campo do Firebase | Variável no `.env` |
| --- | --- |
| `apiKey` | `EXPO_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `EXPO_PUBLIC_FIREBASE_APP_ID` |

4. Em **Authentication → Método de login**, habilite **E-mail/senha** e salve. Não é necessário login por link de e-mail.
5. Após alterar `.env`, reinicie com `npx expo start --clear`.
6. Cadastre uma conta pelo app e confira **Authentication → Usuários** no console.

O `.env` não é enviado ao GitHub; `.env.example` contém os campos públicos do SDK fornecidos pelo grupo, para permitir a execução da entrega. Essa configuração é incorporada ao app. Não use credenciais de conta de serviço ou senha da sua conta Google. `measurementId` e `getAnalytics` não são necessários.

Sem os campos obrigatórios (`apiKey`, `authDomain`, `projectId`, `appId`), o app mostra uma orientação de configuração. Referências: [Firebase com Expo](https://docs.expo.dev/guides/using-firebase/), [configuração Firebase](https://firebase.google.com/docs/web/setup) e [e-mail/senha](https://firebase.google.com/docs/auth/web/password-auth).

## Notificações locais

Confirmar um agendamento ou uma compra salva o evento e solicita um alerta para aproximadamente **1 segundo depois**. O app solicita permissão na primeira utilização e cria o canal Android **Confirmações do Pet Shop**. Alertas aparecem com o app aberto ou em segundo plano, conforme as permissões do aparelho.

- **Alerta solicitado ao celular:** o sistema aceitou o agendamento do alerta, mas seu recebimento ainda não foi observado.
- **Alerta recebido:** o listener recebeu o alerta, ele foi encontrado na barra ao voltar ao app, ou o usuário tocou nele.
- **Alerta desativado / falha ao enviar:** o evento está salvo, mas o envio não foi confirmado.
- **Envio ainda não confirmado:** não foi possível concluir ou registrar a solicitação.

O app reconcilia a barra ao iniciar e ao voltar ao primeiro plano, sem duplicar o histórico. Se um alerta for dispensado enquanto o app está inativo, seu estado pode permanecer como solicitado, pois não há confirmação posterior. Logout tenta cancelar os alertas pendentes e remover os apresentados daquela conta, mantendo o histórico local.

Se a permissão for negada, use **Notificações → Habilitar alertas**. Se o Android não mostrar outra solicitação, habilite as notificações do **Expo Go** nas configurações, incluindo o canal do Pet Shop. Não perturbe e configurações de som também afetam os alertas.

Não são usados tokens de push, servidor ou Firebase Cloud Messaging. O Expo Go no Android suporta notificações locais; push remoto exige development build. [Referência oficial](https://docs.expo.dev/versions/latest/sdk/notifications/).

## Organização e verificações

As telas ficam em `src/screens`; os fluxos, em `src/navigation`; sessão e dados da conta, em `src/contexts`; Firebase, armazenamento e notificações, em `src/services`. Catálogo, estilos e validações ficam separados. As gravações locais são serializadas para evitar perda de atualizações concorrentes.

```powershell
npm run check
npx expo install --check
npx expo-doctor
npm run export:android
```

Os testes cobrem cadastro, datas locais e anos bissextos, totais em centavos, erros, persistência por conta, concorrência, deduplicação, falhas de armazenamento, campos obrigatórios dos registros e retenção das cinco notificações mais recentes. A verificação atual de lint e os 12 testes passaram. O export valida o empacotamento JavaScript Android; não gera APK nem comprova entrega de alertas no aparelho.

Verificações realizadas nesta implementação: lint sem erros, **9 testes automatizados aprovados**, dependências compatíveis, **21/21 verificações do Expo Doctor** e export Android concluído. No Firebase do grupo, uma conta temporária validou cadastro, nome do perfil, logout, novo login e rejeição de senha incorreta; a conta foi removida ao final. A persistência da sessão e a apresentação dos alertas ainda devem ser conferidas no aparelho.

`npm audit` apontou 26 avisos nas dependências (7 moderados e 19 altos), incluindo ferramentas Expo/Metro e módulos Firestore instalados pelo pacote Firebase, que este app não usa. A correção compatível foi executada; os avisos restantes não têm correção dentro das versões atuais. A sugestão `--force` rebaixaria Expo, React Native e Firebase para versões incompatíveis com o projeto. Reavalie com novas versões oficiais antes de usar o app fora da atividade.

### Roteiro de aceitação em Android físico

Execute com o Firebase configurado; estes testes dependem do celular e não estão automatizados:

- [ ] Criar conta; conferir nome/e-mail no perfil e usuário no Firebase.
- [ ] Testar e-mail já cadastrado, senha incorreta, campos inválidos e falha de internet.
- [ ] Fechar e abrir o app; verificar sessão persistente.
- [ ] Agendar banho, tosa e consulta; rejeitar datas passadas e impossíveis.
- [ ] Comprar vários produtos; conferir quantidades, total e histórico.
- [ ] Receber os dois tipos de alerta com o app aberto e conferir estado recebido.
- [ ] Repetir, minimizando o app logo após confirmar; conferir barra e histórico ao retornar.
- [ ] Tocar no alerta; conferir a aba Notificações e ausência de duplicações.
- [ ] Negar permissão; conferir que os eventos são salvos e há aviso adequado.
- [ ] Fazer logout e conferir que não é possível voltar às telas autenticadas.
- [ ] Alternar entre duas contas; verificar isolamento e restauração dos dados da primeira.
- [ ] Conferir rolagem, teclado, tela pequena e fonte ampliada.

### Critérios da atividade

| Critério | Aplicação |
| --- | --- |
| Atendimento às Normas | Autenticação, abas, quatro opções na Home, perfil, logout, dois alertas e entrega com integrantes. |
| Criatividade na Resolução de Problemas | Interface consistente, formulário compartilhado e histórico por conta. |
| Execução do Produto | Verificações automáticas e roteiro de navegação, Firebase e alertas no celular. |
| Pertinência das Informações | Serviços de Pet Shop, simulações identificadas e estados de alerta transparentes. |
| Relacionamento de Conceitos | React Native, Firebase Authentication, React Navigation, AsyncStorage e Expo Notifications. |
