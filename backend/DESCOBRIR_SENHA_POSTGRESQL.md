# Como Descobrir a Senha do PostgreSQL

## Opção 1: Verificar no pgAdmin 4

1. Abra o **pgAdmin 4**
2. No painel esquerdo, expanda **Servers**
3. Clique com o botão direito no servidor PostgreSQL
4. Selecione **Properties** (Propriedades)
5. Vá na aba **Connection** (Conexão)
6. Veja qual senha está configurada lá

## Opção 2: Testar Senhas Comuns

Tente atualizar o `appsettings.json` com uma dessas senhas:

- `postgres` (padrão mais comum)
- `postgresql`
- `145699`
- `123456`
- `admin`
- (deixe vazio se não tiver senha)

## Opção 3: Criar o Banco Manualmente

Se você souber a senha, pode criar o banco manualmente:

1. Abra o **pgAdmin 4**
2. Conecte ao servidor PostgreSQL
3. Clique com botão direito em **Databases** → **Create** → **Database**
4. Nome: `RaizesStore`
5. Clique em **Save**

Depois disso, o backend aplicará as migrations automaticamente quando iniciar.

## Opção 4: Alterar a Senha do PostgreSQL

Se você tem acesso ao PostgreSQL, pode alterar a senha:

1. Abra o **pgAdmin 4**
2. Conecte ao servidor
3. Clique com botão direito no usuário **postgres** → **Properties**
4. Vá na aba **Definition**
5. Altere a senha para uma que você saiba
6. Atualize o `appsettings.json` com a nova senha

## Depois de Descobrir a Senha

1. Atualize o arquivo `appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Database=RaizesStore;Username=postgres;Password=SUA_SENHA_AQUI"
   }
   ```

2. Pare o backend (Ctrl + C)

3. Inicie novamente:
   ```bash
   dotnet run
   ```

4. O backend aplicará as migrations automaticamente e criará todas as tabelas!
