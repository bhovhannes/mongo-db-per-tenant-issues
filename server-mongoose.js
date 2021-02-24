const {createServer} = require('http')
const mongoose = require('mongoose')
const {Schema} = mongoose

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1/test'

const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

const useDbOptions = {
    // this causes number of otherDbs to go up, relatedDbs stays the same
    //useCache: false
    
    // this causes number of relatedDbs to go up in addition to otherDbs
    useCache: true
}


const Property = new Schema({
    key: { type: String, required: true },
    type: { type: String, required: true },
});
const Unlocked = new Schema({
    active: { type: Boolean },
    unlockedAt: { type: Date },
});
const Field = new Schema({
    name: String,
    active: { type: Boolean, required: true },
    subject: String,
    properties: [Property],
    unlocked: Unlocked,
    updatedAt: { type: Date, required: true },
});
const MySchema = new Schema({
    groupId: { type: String, unique: true },
    fieldMap: { type: Map, of: Field },
});


let connectPromise = mongoose.connect(mongoUrl, connectOptions)

async function database(tenantId) {
    await connectPromise;
    
    // the following line leaks memory
    const tenantConnection = mongoose.connection.useDb(`db_${tenantId}`, useDbOptions);
    
    console.log(
        `tenantId:${tenantId}`, 
        `otherDbs:${tenantConnection.otherDbs.length}`, 
        `connection.otherDbs:${mongoose.connection.otherDbs.length}`, 
        `relatedDbs:${Object.keys(tenantConnection.relatedDbs).length}`
    )

    return tenantConnection
}


async function handleRequest(id) {
    const connection = await database(id)
    const res = {
        id,
        otherDbsLength: connection.otherDbs.length,
        relatedDbsLength: Object.keys(connection.relatedDbs).length
    }

    // This creats a class hierarchy representing model and stores it
    // in connection.models, increasing memory used by each connection
    const model = connection.model('email-notifications', MySchema)

    // closing connection does not help
    // await conn.close()

    return res
}


const server = createServer( async function(request, response) {
    const url = new URL(request.url, 'https://127.0.0.1/');
    if (url.pathname.startsWith('/ping')) {
        const result = await handleRequest(url.searchParams.get('id'))
        response.setHeader('content-type', 'application/json')
        response.write(JSON.stringify(result))
        response.end()
    }
    else if (url.pathname.startsWith('/snapshot')) {
        const fs = require('fs')
        const v8 = require('v8')
        const snapshotStream = v8.getHeapSnapshot()
        const fileName = `${Date.now()}.heapsnapshot`
        const fileStream = fs.createWriteStream(fileName)
        snapshotStream.pipe(fileStream)
        response.setHeader('content-type', 'application/json')
        response.write(JSON.stringify({fileName}))
        response.end()
    }
})
server.listen(process.env.PORT || 3000);