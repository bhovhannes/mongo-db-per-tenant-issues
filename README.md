# mongo-db-per-tenant-issues

In db-per-tenant approach we came across a problem where selenium tests were creating a new tenant for each test, and making connection to microservice for that tenant.  
As a result, microservice memory usage was growing overtime, and ending with server going out of memory.

We managed to track the issue down to `mongoose` npm package and logged an issue: https://github.com/Automattic/mongoose/issues/9961


## Prerequisites

1. Run `docker-compose up` to start mongo server.
1. Run `npm ci`.


## Reproduce a memory leak

1. Run `npm run start:mongoose`
1. Simulate load by running `./generate-load.sh 1 100`
1. Notice that connections array is growing over time