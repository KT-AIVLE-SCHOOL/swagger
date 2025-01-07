const express = require('express');
const SwaggerParser = require('@apidevtools/swagger-parser');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const app = express();
const authRoutes = require('./routes/authRoutes');
const port = 3000;

const swaggerDocument = YAML.load(path.join(__dirname, 'openapi/openapi.yml'));

SwaggerParser.bundle(swaggerDocument, {
    resolve: {
        file: {
            basePath: path.join(__dirname, 'openapi') 
        }
    }
}).then((bundledSpec) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(bundledSpec));
});

app.get('/', (req, res) => {
    res.redirect('/api-docs');
})

app.get('/api/hello', (req, res) => {
    res.json({success: true});
});

app.use('/api/auth', authRoutes);

app.listen(port, () => {
    console.log(`서버가 실행 중입니다.`);
});
