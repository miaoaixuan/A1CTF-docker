# A1CTF

### This project is still in the development stage, please do not use it as a production stage.

### Install
#### Set up sql

You need to install a PostgreSQL service, it is recommended to use a Docker container
```bash
$ docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -d postgres
```
Then initialize the database using `up.sql` in the sql directory
Then use `.env.example` as a template to set your database connection information in `.env`

#### Run
As it is in the development stage, it may be necessary to frequently restart the service. It is recommended to use watchexec.
```bash
$ watchexec -e go go run src/main.go
```

#### Initialization
For the convenience of developers, init_deb.py has built-in operations for automatically registering accounts and adding competitions and questions. You only need to run `python init_deb.py`