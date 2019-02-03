const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const knex = require('knex')({
    client: 'pg',
    connection: {
        connectionString : process.env.DATABASE_URL,
        ssl: true
    }
});

console.log(knex.select('*').from('users'));

const app = express();
app.use(express.json());
app.use(cors());

const database = {
    user: [
        {
            id: '123',
            name: 'John',
            email: 'john@gmail.com',
            password: 'cookies',
            entries: 0,
            joined: new Date()
        },
        {
            id: '124',
            name: 'Sally',
            email: 'sally@gmail.com',
            password: 'bananas',
            entries: 0,
            joined: new Date()
        }
    ]
}

app.get('/', (req, res) => {
    res.send("success");
})

app.post('/signin', (req, res) => {
    knex
        .select('email', 'has').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password, data[0].has);
            if (isValid) {
                return(
                    knex
                        .select('*')
                        .from('users')
                        .where('email', '=', req.body.email)
                        .then(user => {
                            res.json(user[0])
                            })
                        .catch(err => res.status(400))
            )}})
        .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    knex.transaction(trx => {
        trx.insert({
                has: hash,
                email: email 
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                            email: loginEmail[0],
                            name: name,
                            joined: new Date()
                            })
                        .then(user => {
                            res.json(user[0]);
                            })
                 })
                 .then(trx.commit)
                 .catch(trx.rollback)
            })
        .catch(err => res.status(400).json('unable to register'));
})

app.get('/profile/:id', (req, res) => {
    const {id} = req.params;
    knex('users')
        .select('*')
        .from('users')
        .where({id: id})
        .then(user => {
            if (user.length) {
                res.json(user[0]);
            } else {
                res.status(400).json('Not Found');
            }
        })
    })

app.put('/image', (req, res) => {
    const {id} = req.body;
    knex('users')
        .where('id', '=', id)
        .increment('entries', 1)
        .returning('entries')
        .then(entries => {
            res.json(entries[0]);
            })
        .catch(err => escape.status(400).json('unable to get entries'))
})

app.listen(process.env.PORT || 3000, ()=>{
    console.log('app is running on port 3000');
})