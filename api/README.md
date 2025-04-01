# CaloriesAI API

## TODO

1. [x] API setup with image upload endpoint (multiple files)
2. [x] Redis storage for images and entry metadata
3. [x] Queue system for processing
4. [x] Basic worker to process images (placeholder LLM integration)
5. [ ] API endpoints to retrieve entry/image status
6. [ ] Frontend image stack display with status
7. [ ] Complete LLM integration for actual analysis
8. [ ] Polish UI/UX for final presentation

## API Usage with curl

### Create a New Entry
```bash
export CALORIESAI_HOST=http://localhost:3000
curl -X POST $CALORIESAI_HOST/entries | jq
# or
export ENTRY_ID=(curl -X POST $CALORIESAI_HOST/entries | jq -r ".id")
```
Response:
```json
{"id":"entry123","createdAt":"2023-01-01T00:00:00.000Z"}
```

### Upload Images to an Entry
```bash
curl -X POST $CALORIESAI_HOST/entries/$ENTRY_ID/images \
  -F "images=@hack/food-images/image1.png" \
  -F "images=@hack/food-images/image2.png" | jq
```
Response:
```json
{"entryId":"entry123","imageIds":["img1","img2"],"count":2}
```

### Get Entry Details
```bash
curl -X GET $CALORIESAI_HOST/entries/$ENTRY_ID | jq
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