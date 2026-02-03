import pg from 'pg';
const { Client } = pg;

async function test() {
    const client = new Client({
        connectionString: "postgresql://user:password@localhost:5432/iplayer"
    });
    try {
        await client.connect();
        console.log("Connected successfully");
        await client.end();
    } catch (err) {
        console.error("Connection error", err);
    }
}

test();
