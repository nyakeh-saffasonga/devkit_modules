const mongoose = require('mongoose');

let listenersAttached = false;

function attachListeners() {
    if (listenersAttached) return;
    listenersAttached = true;

    mongoose.connection.on('connected', () => {
        console.log(`mongoDB connected: ${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
        console.log(`mongoDB error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.log(`mongoDB disconnected`);
});
}

async function connect(uri, options = {}) {
    if (!uri) {
        throw new Error('Database connection failed: A URI string must be provided.');
    }

    mongoose.set("strictQuery", true); // 
    attachListeners();

    const defaultOptions = {
        serverSelectionTimeoutMS: 10000,
        ...options
    };

    try {
        await mongoose.connect(uri, defaultOptions);
    } catch (error) {
        throw new Error(`Could not connect to mongoDB: ${error.message}`);
    }
}

async function disconnect() {
    await mongoose.connection.close();
}

function isConnected() {
    return mongoose.connection.readyState === 1;
}


class Repository {

    constructor(model) {
        if (!model) throw new Error("A Mongoose model is required.");
        this.model = model;
    }

    async create(data) {
        const record = new this.model(data);
        return record.save();
    }

    async findById(id) {
        return this.model.findById(id);
    }

    async find(query = {}, options = {}) {
        return this.model.find(query, null, options);
    }

    async update(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id) {
        return this.model.findByIdAndDelete(id);
    }

}

module.exports = { connect, disconnect, isConnected, Repository };
