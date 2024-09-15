import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const ARIKEDB_SERVER = process.env.ARIKEDB_SERVER || '127.0.0.1';
const ARIKEDB_PORT = process.env.ARIKEDB_PORT || '6923';


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
