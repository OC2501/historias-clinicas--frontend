const http = require('http');

http.get('http://localhost:3000/docs-json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const swagger = JSON.parse(data);
      const paths = swagger.paths || {};
      const endpoint = paths['/api/doctor/dashboard'] || paths['/doctor/dashboard'];
      
      if (!endpoint) {
          console.log('Endpoint not found. Available paths:');
          Object.keys(paths).filter(p => p.includes('dashboard')).forEach(p => console.log(p));
          return;
      }
      
      console.log('ENDPOINT:', JSON.stringify(endpoint, null, 2));
      
      const successResponse = endpoint.get && endpoint.get.responses && endpoint.get.responses['200'];
      if (!successResponse) {
          console.log('No 200 response found.');
          return;
      }
      
      const content = successResponse.content && successResponse.content['application/json'];
      if (content && content.schema && content.schema['$ref']) {
          const ref = content.schema['$ref'];
          const schemaName = ref.split('/').pop();
          const schema = swagger.components.schemas[schemaName];
          console.log('SCHEMA:', JSON.stringify(schema, null, 2));
      } else {
          console.log('No ref schema found, content:', JSON.stringify(content, null, 2));
      }
      
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', (e) => {
  console.error(e.message);
});
