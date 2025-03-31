# CaloriesAI API

## TODO

- [ ] API setup with image upload endpoint (multiple files)
- [ ] Redis storage for images and entry metadata
- [ ] Queue system for processing
- [ ] Basic worker to process images (placeholder LLM integration)
- [ ] API endpoints to retrieve entry/image status
- [ ] Frontend image stack display with status
- [ ] Complete LLM integration for actual analysis
- [ ] Polish UI/UX for final presentation

## API Usage with curl

### Create a New Entry
```bash
curl -X POST http://localhost:3000/entries | jq
```
Response:
```json
{"id":"entry123","createdAt":"2023-01-01T00:00:00.000Z"}
```

### Upload Images to an Entry
```bash
curl -X POST http://localhost:3000/entries/{entryId}/images \
  -F "images=@hack/food-images/image1.png" \
  -F "images=@hack/food-images/image2.png" | jq
```
Response:
```json
{"entryId":"entry123","imageIds":["img1","img2"],"count":2}
```

### Get Entry Details
```bash
curl -X GET http://localhost:3000/entries/{entryId} | jq
```
Response:
```json
{
  "id":"entry123",
  "status":"processing",
  "images":[
    {"id":"img1","filename":"image1.jpg","mimetype":"image/jpeg","size":12345,"status":"pending"},
    {"id":"img2","filename":"image2.jpg","mimetype":"image/jpeg","size":67890,"status":"pending"}
  ]
}
```

Note: Replace `{entryId}` with the actual entry ID returned from the create entry endpoint.