<?php 
/*QUERY THE USER DATABASE AND RETURN THE RESULTS AS AN ARRAY OF USERS. */
require_once($_SERVER["DOCUMENT_ROOT"].'/objects/functions_queries.php'); //functions file, includes database connection
  //query from functions file: function query_by($the_table,$the_filters, $the_sort)
$_SESSION['db_name'] = "marketin_global_db";
    //bind to $name
echo "Accessed Login Encrypter";
$stmt= query_by('user_login','', '');

 $result_array = Array();
$i=0;
    while(mysqli_fetch_assoc($stmt)) {
			foreach ($stmt as $key => $value){
				
        $result_array[$i][$key] = $value;
				if($key=="ID"){$i++;}
			};
    }
/* FYI, THIS IS WHAT MY ARRAY LOOKS LIKE:
Array ( [0] => Array ( [ID] => 1 [email] => design@cejay.com [username] => lisab [user_permissions] => ALL [password] => ******* [country] => Panama [multi_country] => y ) )

Array ( [1] => Array ( [ID] => 2 [email] => candeeg@cejayassoc.com [username] => candeeg [user_permissions] => ALL [password] => ****** [country] => Panama [multi_country] => y ) ) 
*/
    //convert the PHP array into JSON format, so it works with javascript
    if ($json_array = json_encode($result_array)) {echo "<br>array succes:";}else {echo "Failed to make array";}
?>
    const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex')({
    client: 'pg',
    connection: {
        connectionString : process.env.DATABASE_URL,
        ssl: true,
    }
});

const app = express();
app.use(express.json());
app.use(cors());
var arrayObjects = <?php echo $json_array; ?> /*RESULTS OF QUERY, ARRAY OF USERS*/
/*const database = {
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
*/
app.get('/', (req, res) => {
    res.send('It is working!');
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
    const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
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

app.listen(process.env.PORT || 3000, ()=> {
    console.log(`app is running on port ${process.env.PORT}`)
})
