function setupSession(){
const sessionId = 'session1'

const htmlContent =
`
<div class="text-center">
            <h2 class="mb-12 section-heading wow fadeInDown" data-wow-delay="0.3s">脑健康行动</h2>
</div>

<!-- 介绍CDT -->
<div class="w-full sm:w-1/2 md:w-1/2 lg:w-1/3">
  <div class="m-4 wow fadeInRight" data-wow-delay="0.3s">
    <div class="icon text-5xl">
      <i class="lni lni-bar-chart"></i>
    </div>
    <div>
      <p class="text-gray-600">大会将于2024年7月21日在国家会议中心（北京）召开，发起全国范围的健康科普宣传与早筛查预防。<br><br>通过观察被测试者画出的钟表，可以评估他们的认知能力、注意力、记忆以及执行功能等方面的状况，特别是在评估老年人或患有认知功能障碍的患者时具有重要意义。</p>
    </div>
  </div>
</div>

<!-- 你准备好了吗？ -->
<div id=${sessionId} class="w-full sm:w-1/2 md:w-1/2 lg:w-1/3">
  <div class="m-4 wow fadeInRight" data-wow-delay="3.5s">
    <div class="flex items-center justify-between">
        <p class="text-gray-600 mb-0">点击开始...</p>  
        <button id=${sessionId} type="button" class="loadNext btn ml-2" data-wow-delay="3.5s">
          <img src="assets/img/favicon.png" alt="Next">
        </button>
    </div>
  </div>
</div>


`

document.dispatchEvent(new CustomEvent('displayContent', { detail: { htmlContent } }));

setTimeout(() => {  // Ensure content is rendered
  document.getElementById(sessionId).addEventListener('click', function() {
    const divToHide = document.getElementById(sessionId)
    divToHide.style.display='none'
    document.dispatchEvent(new CustomEvent('loadNextSession', {
          detail: { sessionNum: 2 }  // Move to next session
      }));
  });
}, 0);

}


export { setupSession };