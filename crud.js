// config inicial
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config()


const DB_USER  = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD


// Conectar ao banco de dados MongoDB E inciciar na porta 3000
mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@apicluster.p7xta03.mongodb.net/bancodaapi?retryWrites=true&w=majority`)
  .then(() => {
    console.log("contectamos ao mongoDB")
    app.listen(3000)
  })
  .catch((err) => console.log(err))

// Definir o esquema para o modelo de usuário
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

// Definir o esquema para o modelo de grupo de usuários
const groupSchema = new mongoose.Schema({
  name: String,
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  description: String,
});

// Definir o esquema para o modelo de registro de dívidas
const debtSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  description: String,
});

// Criar os modelos com base nos esquemas definidos
const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);
const Debt = mongoose.model('Debt', debtSchema);

const app = express();
// Configurar o CORS com origens permitidas
app.use(cors());
app.use(express.json());

// Endpoint para criar um usuário
app.post('/users', function (req, res) {
  const { name, email, password } = req.body;
  const user = new User({ name, email, password });

  try {
    user.save().then(() => {
      res.status(201).json({ message: 'usuario inserido' });
    });
  } catch (error) {
    res.status(500).send('Erro ao criar o usuário');
  }


});

// Endpoint para obter todos os usuários
app.get('/users', async (req, res) => {

  try {
    const showUsers = await User.find()

    res.status(200).json(showUsers)
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

// Endpoint para obter  usuário UNICO
app.get('/users/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const showUser = await User.findOne({ _id: id })

    res.status(200).json(showUser)
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

// Endpoint para atualizar um usuário
app.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  const user = {
    name,
    email,
    password
  }

  try {
    const updatedUser = await User.updateOne({ _id: id }, user)

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

// Endpoint para excluir um usuário
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  const userToBeDeleted = await User.findOne({ _id: id })

  try {
    await User.deleteOne({ _id: id })

    res.status(200).json({ message: 'Usuario removido com sucesso' })
  } catch (error) {
    res.status(500).json({ error: error })
  }

});

// Endpoint para criar um grupo
app.post('/groups', async function (req, res) {
  const { name, users, description } = req.body;
  //const showUser = await User.findOne({ name: "vaiporfavor" })
  //console.log(showUser)
  //res.status(200)
  let idArray = []
  for (userName of users) {
    let showUser = await User.findOne({ name: userName })
    //console.log(showUser._id.toString())
    let showUserString = showUser._id.toString()
    idArray.push(showUserString)
  }
  //console.log(idArray)
  const group = new Group({ name, users: idArray, description });
  //console.log(group._id.toString())
  try {

    group.save().then(() => {
      res.status(201).json({ message: 'grupo criado', groupID: group._id.toString() });
    })
  } catch (error) {
    res.status(500).send('Erro ao criar o grupo');
  }
});

// endpoint para add usuarios ao grupo
app.patch('/groups/:id', async (req, res) => {
  const { id } = req.params;
  const { users } = req.body;
  const group = {
    users,
  }

  try {
    const updatedGroup = await Group.updateOne({ _id: id }, group)

    res.status(200).json(group)
  } catch (error) {
    res.status(500).json({ error: error })
  }

})

// Endpoint para obter todos os grupos de usuários
app.get('/groups', async (req, res) => {

  try {
    const showGroups = await Group.find()

    res.status(200).json(showGroups)
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

// endpoint para obter um grupo UNICO
app.get('/groups/:id', async (req, res) => {
  const id = req.params.id;

  let showName = []

  try {
    const showGroup = await Group.findOne({ _id: id })
    for (idUsuario of showGroup.users){
      let getUser = await User.findOne({ _id:  idUsuario})
      showName.push(getUser.name)
      //console.log(idUsuario)
      //console.log(getUser)
    }
    res.status(200).json({showGroup, userNames: showName})
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// endpoint para obter todos os grupos DAQUELE usuario
app.get('/groups/user/:id', async (req, res) => {
  const idUsuario = req.params.id;

  // Consulta condicional para buscar grupos que contenham o ID do usuário
  Group.find({ users: idUsuario })
    .then(grupos => {
      res.status(200).json(grupos);
    })
    .catch(error => {
      res.status(500).json({ error: 'Erro ao buscar os grupos' });
    });
});
// Endpoint para excluir um grupo
app.delete('/groups/:id', async (req, res) => {
  const { id } = req.params;

  const groupToBeDeleted = await Group.findOne({ _id: id })

  try {
    await Group.deleteOne({ _id: id })

    res.status(200).json({ message: 'grupo excluido com sucesso' })
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

// Endpoint para criar um registro de dívida
app.post('/debts', async function (req, res) {
  const { group, user, amount, description } = req.body;
  
  let getUser = await User.findOne({ name: user })
  let userId = getUser._id.toString();
  const debt = new Debt({ group, user: userId, amount, description });

  try {
    debt.save().then(() => {
      res.status(201).json({ message: 'divida inserida' })
    });
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

// Endpoint para obter todos os registros de dívidas
app.get('/debts', async (req, res) => {
  try {
    const showDebts = await Debt.find()

    res.status(200).json(showDebts)
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

// endpoint para obter todos os gastos DAQUELE grupo
app.get('/debts/group/:id', async (req, res) => {
  const idGrupo = req.params.id;
  //console.log(req.params)
  let debArray = []

  // Consulta condicional para buscar grupos que contenham o ID do usuário
  Debt.find({ group: idGrupo })
    .then(async debts => {
      for (debt of debts) {
      
        let showUser = await User.findOne({ _id: debt.user })
        let object = {debtValue: debt.amount, debtId: debt._id, debtUser: showUser.name, debtUserId: debt.user, debtDescription: debt.description, debtGroup: debt.group }
        //console.log(showUser.name)
        //console.log(object.debtUser)
        debArray.push(object)
      }
      //console.log(debArray)
      res.status(200).json(debArray);
    })
    .catch(error => {
      res.status(500).json({ error: 'Erro ao buscar os grupos' });
    });
});

// Endpoint para excluir um registro de dívida
app.delete('/debts/:id', async (req, res) => {
  const { id } = req.params;

  const debtToBeDeleted = await Debt.findOne({ _id: id })

  try {
    await Debt.deleteOne({ _id: id })

    res.status(200).json({ message: "divida excluida" })
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

// endpoint de login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // Lógica de autenticação - verifique as credenciais do usuário
  const tryEmail = req.params.email;

  try {
    const showUser = await User.findOne({ email: email })
    //console.log(showUser.email, showUser.password, email, tryEmail)
    if (email === showUser.email && password === showUser.password) {
      // Autenticação bem-sucedida
      res.status(200).json({ message: 'Login bem-sucedido', userId: showUser._id.toString() });
    } else {
      // Autenticação falhou
      res.status(500).json({ message: 'Nome de usuário ou senha inválidos' });
    }
  } catch (error) {
    res.status(500).json({ error: error })
  }
});


