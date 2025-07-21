import express from 'express';
import { productBulkHandler } from './handlers/product-bulk';
import { productBulkStatusHandler } from './handlers/product-bulk-status';
import { PORT } from './config';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bulk API Service Running');
});

app.post('/product/bulk', productBulkHandler);

app.get('/product/bulk/status/:bulkRequestId', productBulkStatusHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
