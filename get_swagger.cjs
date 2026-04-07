const http = require('http');
const fs = require('fs');

http.get('http://localhost:3000/docs-json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const swagger = JSON.parse(data);
      const paths = swagger.paths || {};
      const endpoint = paths['/api/doctor/dashboard'] || paths['/doctor/dashboard'];
      
      let out = {};
      if (endpoint) {
          out.endpoint = endpoint;
          const successResponse = endpoint.get && endpoint.get.responses && endpoint.get.responses['200'];
          if (successResponse) {
              const content = successResponse.content && successResponse.content['application/json'];
              if (content && content.schema && content.schema['$ref']) {
                  const ref = content.schema['$ref'];
                  const schemaName = ref.split('/').pop();
                  out.schema = swagger.components.schemas[schemaName];
              }
          }
      }
      fs.writeFileSync('swagger_output.json', JSON.stringify(out, null, 2));
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', (e) => {
  console.error(e.message);
});
