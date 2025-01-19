<template>
  <div id="app" data-v-app style="padding: 0">
    <div class="main-container">
      <div class="container">
        <div class="video-wrapper">
          <canvas ref="canvasElement"></canvas>
          <p>處理中的畫面</p>
        </div>

        <div class="video-section">
          <div class="video-col">
            <media-player src="http://localhost:5001/video/output.mp4">
              <media-provider></media-provider>
              <media-video-layout
                thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
              ></media-video-layout>
            </media-player>
          </div>
          <BProgress :max="total" class="w-100 mb-2">
            <BProgressBar :value="time" :label="`${time} / ${total} `"></BProgressBar>
          </BProgress>
          <br />
          <span>已過/預估完成時間 : {{ elapsed }} / {{ remaining }} </span>
          <br />
          <br />
          <input type="file" @change="handleFileChange" accept="video/*,image/*" />
          <br />
          <br />
          <div class="controls">
            <button @click="uploadFile">Upload video</button>
            <button @click="uploadFile">Image upload</button>
            <button @click="example">Run example</button>
          </div>
        </div>
      </div>

      <div class="grid-section" style="margin-top: 10px">
        <br />
        <div class="input-button-container">
          <input v-model="searchQuery" placeholder="搜尋 Track ID 或 Name" />
          <button @click="search">搜尋</button>
        </div>
        <br />
        <GridLayout
          v-model:layout="layout"
          :col-num="colNum"
          :row-height="30"
          :is-draggable="true"
          :is-resizable="true"
          :is-mirrored="false"
          :vertical-compact="true"
          :use-css-transforms="true"
          :margin="[10, 10]"
          :responsive="true"
        >
          <GridItem
            v-for="item in layout"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            :key="item.itemKey"
          >
            <div class="item-container">
              <!-- {{ track_data[index] }} -->
              <p style="text-indent: 1em">Track id {{ item.itemKey }}</p>
              <p style="text-indent: 1em">Name: {{ item.name }}</p>
              <p style="text-indent: 1em">
                出現時間:
                <a href="#" @click.prevent="setPlayerTime(item.appear)">{{ item.appear }}</a>
              </p>
              <p style="text-indent: 1em">
                消失時間:
                <a v-if="item.disappear" href="#" @click.prevent="setPlayerTime(item.disappear)">{{
                  item.disappear
                }}</a>
                <span v-else>尚未消失</span>
              </p>

              <div class="image-container">
                <div class="image-container">
                  <img
                    v-if="item.appear_image_path"
                    :src="'http://localhost:5001/image/' + item.appear_image_path"
                    alt="出現人物"
                    class="scaled-image"
                  />
                </div>
              </div>
            </div>
            <!-- <p>消失時間: {{ item.disappear }}</p> -->
            <!-- <p>消失圖片:</p>
            <img
              v-if="item.disappear_image_path"
              :src="getImage(item.disappear_image_path)"
              alt="消失圖片"
            /> -->
          </GridItem>
        </GridLayout>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import io from 'socket.io-client'
import axios from 'axios'
import 'vidstack/bundle'
import { GridLayout, GridItem } from 'vue3-grid-layout'

const track_data = ref()
const layout = ref([])
//   [{ x: 0, y: 5, w: 2, h: 5, i: '6', static: false },
//   { x: 2, y: 5, w: 2, h: 5, i: '7', static: false },
//   { x: 2, y: 5, w: 2, h: 5, i: '7', static: false },
//   { x: 2, y: 5, w: 2, h: 5, i: '7', static: false },
//   { x: 0, y: 10, w: 2, h: 5, i: '12', static: false },
//   { x: 4, y: 8, w: 2, h: 5, i: '14', static: false },
//   { x: 4, y: 5, w: 2, h: 5, i: '8', static: false },
//   { x: 0, y: 9, w: 2, h: 5, i: '18', static: false }]
const file = ref(null)
const fileType = ref(null)
const searchQuery = ref('')
const time = ref(0)
const total = ref(0)
const elapsed = ref(0)
const remaining = ref(0)
const socket = ref(null)
const colNum = ref(10)
const captureInterval = ref(null)

onMounted(() => {
  fetch('track_info.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('網絡錯誤')
      }
      return response.json()
    })
    .then((data) => {
      track_data.value = data // 將整個 JSON 對象賦值給 videos
      addItems()

      // const player = document.querySelector('media-player')
      // player.currentTime = 1.0
      console.log('讀取的 JSON 數據:', data)
    })
    .catch((error) => {
      console.error('讀取 JSON 失敗:', error)
    })
  // videoLayout.smallWhen = ({ width, height }) => width < 800 || height < 380
})

let index = 0

const search = () => {
  const query = searchQuery.value
  axios
    .get('http://localhost:5001/query', {
      params: {
        name: query
      }
    })
    .then((response) => {
      const results = response.data
      layout.value = results.map((item, index) => ({
        x: (index * 2) % (colNum.value || 10),
        y: 0,
        w: 2,
        h: 7,
        i: index.toString(),
        itemKey: item.track_id,
        ...item
      }))
    })
    .catch((error) => {
      console.error('Search failed:', error)
    })
}

const addItems = () => {
  const entries = Object.entries(track_data.value)
  entries.forEach(([key, item]) => {
    layout.value.push({
      x: (layout.value.length * 2) % (colNum.value || 10), // puts it at the bottom
      y: 0,
      w: 2,
      h: 7,
      i: index.toString(),
      itemKey: key, // 保存 track_data 的 key

      ...item
    })
    index++
  })
}

async function startStream() {
  // const canvas = this.$refs.canvasElement
  // canvas.width = this.$refs.videoElement.videoWidth || 640
  // canvas.height = this.$refs.videoElement.videoHeight || 480

  socket.value = io('http://localhost:5001')
  socket.value.on('processed_frame', (data) => {
    handleServerMessage(data)
  })
}

const setPlayerTime = (time) => {
  const player = document.querySelector('media-player')
  player.currentTime = parseFloat(time)
}

const handleFileChange = (event) => {
  file.value = event.target.files[0]
  fileType.value = file.value.type.startsWith('video/') ? 'video' : 'image'
  console.log('Selected file:', fileType.value)
}

const uploadFile = () => {
  if (file.value) {
    const formData = new FormData()
    formData.append(fileType.value, file.value)

    axios
      .post(`http://localhost:5001/upload/${fileType.value}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then((response) => {
        console.log('Upload success:', response.data)
      })
      .catch((error) => {
        console.error('Upload failed:', error)
      })
  } else {
    console.log('請先選擇一個文件')
  }
}

// const getImage = (filename) => {

//   if (filename) {

//     axios.post(`http://localhost:5001/image/${filename}`, {
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     }).then((response) => {
//       console.log('請求成功:', response.data)
//       re
//     }).catch((error) => {
//       console.error('請求失敗:', error)
//     })
//   }

// }

async function getVideoURL() {
  const player = document.querySelector('media-player')
  try {
    socket.value = io('http://localhost:5001')
    socket.value.on('video_processed', (data) => {
      player.src = data.video_url
      console.log('Received video URL:', data.video_url)
    })
  } catch (err) {
    console.error('Failed to get video URL:', err)
  }
}

async function receiveImage() {
  try {
    socket.value = io('http://localhost:5001')
    socket.value.on('images_processed', (data) => {
      console.log('Received images:', data.images)
    })
  } catch (err) {
    console.error('Failed to get images:', err)
  }
}

const handleServerMessage = (data) => {
  console.log('Received processed frame from the server')
  const img = new Image()
  img.onload = () => {
    const canvas = document.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }
  img.src = 'data:image/jpeg;base64,' + data.frame

  time.value = data.time
  total.value = data.total
  elapsed.value = data.elapsed
  remaining.value = data.remaining
}

async function getTrackInfo() {
  try {
    socket.value = io('http://localhost:5001')
    socket.value.on('track_info', (data) => {
      console.log('Received track info:', data.track_info)
    })
  } catch (err) {
    console.error('Failed to get track info:', err)
  }
}

const example = () => {
  console.log('Example button clicked')
  startStream()
  getVideoURL()
  getTrackInfo()

  axios
    .post('http://localhost:5001/example', {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((response) => {
      console.log('請求成功:', response.data)
    })
    .catch((error) => {
      console.error('請求失敗:', error)
    })
}
</script>

<style scoped>
.input-button-container {
  display: flex; /* 使用 flexbox 來排列元素 */
  align-items: stretch; /* 使所有子元素的高度相同 */
  height: 36px;
}

input[type='text'] {
  width: 600px; /* 設置為父容器的 100% 寬度 */
  padding: 10px; /* 設置內邊距 */
  font-size: 16px; /* 設置字體大小 */
}

.item-container {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.scaled-image {
  width: 105px; /* 設置固定寬度 */
  height: 120px; /* 設置固定高度 */
  display: block;
  margin: 0 auto;
}
.main-container {
  display: flex;
  flex-direction: row;
  gap: 20px; /* 添加左右两栏之间的间距 */
  padding: px;
}

.video-col {
  width: 100%;
  margin-bottom: 20px;
}

.grid-section {
  width: 1080px;
}

.container {
  flex: 0 0 auto; /* 防止容器被拉伸 */
  width: auto; /* 让容器宽度由内容决定 */
}

.video-section {
  padding: 0; /* 移除多余的内边距 */
  width: 640px; /* 设置固定宽度 */
}
.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.video-wrapper {
  position: relative;
  width: 640px;
  height: 480px;
}

video,
canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-wrapper p {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
}

.controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

button {
  padding: 8px 16px;
  font-size: 16px;
  background-color: #61065c;
  color: white;
  border: none;
  border-radius: 5px;
  min-width: 120px;
  cursor: pointer;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
}

.progress-text {
  color: black;
  background-color: white;
  padding: 2px 5px;
  border-radius: 3px;
}
button:hover {
  background-color: #0056b3;
}

.vue-grid-layout {
  background: #eee;
  padding: 10px; /* 添加內邊距 */
  border-radius: 8px; /* 添加圓角 */
}

.vue-grid-item:not(.vue-grid-placeholder) {
  background: #ccc;
  border: 1px solid black;
  border-radius: 5px; /* 添加圓角 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 添加陰影 */
}

.vue-grid-item .text {
  font-size: 24px;
  text-align: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vue-grid-item .static {
  background: #cce;
}

.vue-grid-item .resizing {
  opacity: 0.9;
}

.vue-grid-item .no-drag {
  height: 100%;
  width: 100%;
}

.vue-grid-item .minMax {
  font-size: 12px;
}

.vue-grid-item .add {
  cursor: pointer;
}

.vue-draggable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 0;
  left: 0;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>")
    no-repeat;
  background-position: bottom right;
  padding: 0 8px 8px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: pointer;
}

media-player {
  width: 100%;
  aspect-ratio: 4/3;
}

.progress-container {
  margin: 10px 0;
  width: 100%;
}

input[type='file'] {
  width: 100%;
  margin: 10px 0;
}
</style>
