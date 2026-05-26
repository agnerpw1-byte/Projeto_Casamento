# 💍 Lista de Casamento

App para gerenciar a lista de itens do casamento com Firebase + Vercel.

---

## 🚀 Como configurar e fazer o deploy

### 1. Firebase — criar o projeto

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** e dê um nome (ex: `lista-casamento`)
3. No menu lateral, vá em **Firestore Database → Criar banco de dados**
4. Escolha **"Iniciar no modo de produção"** e selecione a região `us-east1` (ou a mais próxima)
5. No menu lateral, vá em **Configurações do projeto (⚙️) → Seus apps → Web (`</>`)**
6. Registre o app e copie o objeto `firebaseConfig`

#### Regras do Firestore

Vá em **Firestore → Regras** e cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ Essas regras são simples pois o app já tem proteção por senha. Para mais segurança futuramente, adicione autenticação Firebase.

---

### 2. Subir no GitHub

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/lista-casamento.git
git push -u origin main
```

---

### 3. Vercel — fazer o deploy

1. Acesse [vercel.com](https://vercel.com) e faça login com o GitHub
2. Clique em **"Add New Project"** e selecione o repositório `lista-casamento`
3. O Vercel vai detectar automaticamente o Vite
4. Antes de fazer o deploy, vá em **"Environment Variables"** e adicione:

| Nome | Valor |
|------|-------|
| `VITE_FIREBASE_API_KEY` | sua_api_key |
| `VITE_FIREBASE_AUTH_DOMAIN` | seu_projeto.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | seu_projeto |
| `VITE_FIREBASE_STORAGE_BUCKET` | seu_projeto.appspot.com |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | seu_sender_id |
| `VITE_FIREBASE_APP_ID` | seu_app_id |

5. Clique em **"Deploy"** ✅

---

### 4. Desenvolvimento local

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/lista-casamento.git
cd lista-casamento

# Instale as dependências
npm install

# Crie o arquivo .env com suas credenciais
cp .env.example .env
# Edite o .env com os valores do Firebase

# Rode localmente
npm run dev
```

---

## 📁 Estrutura do projeto

```
lista-casamento/
├── index.html          # HTML principal
├── app.js              # Lógica do app (renderização, eventos)
├── style.css           # Estilos (tema verde abacate)
├── src/
│   ├── firebase.js     # Inicialização do Firebase
│   └── db.js           # Funções do Firestore (CRUD + realtime)
├── .env.example        # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
├── vite.config.js
└── vercel.json
```

---

## 🔐 Senha padrão

A senha padrão é `Espada123`. Altere-a dentro do app após o primeiro acesso em **"Senha"** no topo da tela.

---

## ✨ Funcionalidades

- ✅ Login por senha (salva no Firestore)
- ✅ Adicionar, editar e remover itens
- ✅ Marcar item como comprado
- ✅ Definir valor, prioridade e categoria
- ✅ Reordenar itens por arrastar e soltar (desktop e mobile)
- ✅ Filtrar por status e prioridade
- ✅ Sincronização em tempo real entre dispositivos
- ✅ Aba "Lista de presentes" com itens pendentes
- ✅ Copiar lista formatada para WhatsApp
- ✅ Totalmente responsivo para mobile
