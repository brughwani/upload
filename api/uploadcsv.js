// api/uploadCsv.js
import admin from 'firebase-admin';
import multer from 'multer';
import csv from 'csv-parser';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

// Multer configuration to handle file uploads
const upload = multer({ storage: multer.memoryStorage() });

export const config = {
    api: {
        bodyParser: false, // Disabling bodyParser to handle multipart/form-data
    },
};

// The main upload function
const handler = async (req, res) => {
    if (req.method === 'POST') {
        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(500).json({ error: 'Could not upload file' });
            }

            const results = [];

            // Parse the CSV file
            const readStream = req.file.buffer.toString('utf-8');
            const csvReadStream = require('stream').Readable.from(readStream.split('\n'));

            csvReadStream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        // Upload each entry to Firestore
                        const collectionName = 'your_collection_name'; // Change to your Firestore collection
                        for (const entry of results) {
                            await db.collection(collectionName).add(entry);
                        }
                        return res.status(200).json({ message: 'Data uploaded successfully!' });
                    } catch (uploadError) {
                        return res.status(500).json({ error: 'Error uploading data to Firestore' });
                    }
                });
        });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default handler;
