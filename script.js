/**
 * D-Day 매니저 스크립트 (다중 일정 & 로컬 스토리지 적용)
 * 디자인 원칙: Tailwind 유틸리티 클래스를 동적으로 적용하여 반응형/인터랙션을 극대화합니다.
 */

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------
    // 1. DOM 요소 선택
    // -----------------------------------------------------------------
    
    // [데스크톱 입력 폼]
    const desktopTitleInput = document.getElementById('dday-title');
    const desktopDateInput = document.getElementById('dday-date');
    const desktopAddBtn = document.getElementById('add-btn');

    // [모바일 입력 폼]
    const mobileAddToggleBtn = document.getElementById('mobile-add-toggle');
    const mobileAddPanel = document.getElementById('mobile-add-panel');
    const mobileTitleInput = document.getElementById('mobile-dday-title');
    const mobileDateInput = document.getElementById('mobile-dday-date');
    const mobileSubmitBtn = document.getElementById('mobile-submit-btn');

    // [전체 화면 제어 영역]
    const emptyState = document.getElementById('empty-state');
    const heroContainer = document.getElementById('hero-container');
    const listContainer = document.getElementById('list-container');
    const ddayList = document.getElementById('dday-list');
    
    // [히어로(메인) 카드 영역 내 세부 요소]
    const heroTitle = document.getElementById('hero-title');
    const heroDate = document.getElementById('hero-date');
    const heroDday = document.getElementById('hero-dday');
    const heroStatus = document.getElementById('hero-status');
    const heroIcon = document.getElementById('hero-icon');
    const heroDeleteBtn = document.getElementById('hero-delete-btn');

    // [삭제 모달 요소]
    const deleteModal = document.getElementById('delete-modal');
    const deleteModalOverlay = document.getElementById('delete-modal-overlay');
    const deleteModalContent = document.getElementById('delete-modal-content');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');


    // -----------------------------------------------------------------
    // 2. 상태 관리 (State)
    // -----------------------------------------------------------------
    
    // 로컬 스토리지(브라우저 저장소)에서 기존 일정을 불러오며, 없으면 빈 배열
    let ddays = JSON.parse(localStorage.getItem('ddays')) || [];
    let currentDeleteId = null; // 현재 삭제하려는 항목의 고유 ID


    // -----------------------------------------------------------------
    // 3. 앱 초기화 (Init)
    // -----------------------------------------------------------------
    
    // 1초(1000ms)마다 화면 전체를 새로 그리는 대신, 값만 업데이트
    setInterval(updateCountdownsOnly, 1000);


    // -----------------------------------------------------------------
    // 4. 이벤트 리스너 바인딩
    // -----------------------------------------------------------------
    
    // (A) 데스크톱 환경 일정 추가
    desktopAddBtn.addEventListener('click', () => {
        if (addDdayItem(desktopTitleInput.value.trim(), desktopDateInput.value)) {
            desktopTitleInput.value = '';
            desktopDateInput.value = '';
        }
    });

    // (B) 모바일 환경 일정 추가 (패널 토글 및 등록)
    mobileAddToggleBtn.addEventListener('click', () => {
        mobileAddPanel.classList.toggle('hidden');
    });

    mobileSubmitBtn.addEventListener('click', () => {
        if (addDdayItem(mobileTitleInput.value.trim(), mobileDateInput.value)) {
            mobileTitleInput.value = '';
            mobileDateInput.value = '';
            mobileAddPanel.classList.add('hidden'); // 성공 시 창 닫기
        }
    });

    // (C) 모달 제어 (창 닫기 등)
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    deleteModalOverlay.addEventListener('click', closeDeleteModal); // 바깥 어두운 배경 클릭 시 닫기

    // 모달에서 삭제 버큰 클릭 시 실제 데이터 배열에서 삭제 진행
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteId) {
            ddays = ddays.filter(item => item.id !== currentDeleteId);
            saveToStorage();
            renderApp();
            closeDeleteModal();
        }
    });

    // (D) 히어로(메인) D-Day 영역 삭제 버튼 클릭 이벤트
    heroDeleteBtn.addEventListener('click', () => {
        const id = heroContainer.dataset.id;
        if (id) openDeleteModal(id);
    });


    // -----------------------------------------------------------------
    // 5. 핵심 로직 함수들
    // -----------------------------------------------------------------

    /**
     * 배열에 새로운 일정을 추가합니다. (유효성 검사 포함)
     */
    function addDdayItem(title, dateStr) {
        if (!dateStr) {
            alert('목표 날짜를 반드시 선택해 주세요!');
            return false;
        }

        const newItem = {
            id: 'dday_' + Date.now().toString(), // 중복되지 않는 고유 키 (타임스탬프)
            title: title || '새로운 소중한 일정',
            date: dateStr,
            createdAt: Date.now()
        };

        ddays.push(newItem);
        saveToStorage();
        renderApp();
        return true;
    }

    /**
     * 현재 배열 상태를 로컬 스토리지에 동기화합니다.
     */
    function saveToStorage() {
        localStorage.setItem('ddays', JSON.stringify(ddays));
    }

    /**
     * 목표 날짜와 현재 시간 사이의 정확한 차이(일, 시간, 분, 초)를 계산합니다.
     * @returns {Object} 계산된 결과 객체 { days, hours, minutes, seconds, diffMs, isPast }
     */
    function getExactDiff(targetDateStr) {
        const now = new Date();
        // 목표 날짜를 가져오되, 카운트다운 감각을 위해 자정으로 기준 지정
        const target = new Date(targetDateStr);
        target.setHours(0, 0, 0, 0);

        const diffMs = target.getTime() - now.getTime();
        const absoluteDiffMs = Math.abs(diffMs); // 과거일 경우 양수로 변환해 계산

        const days = Math.floor(absoluteDiffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((absoluteDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((absoluteDiffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((absoluteDiffMs % (1000 * 60)) / 1000);

        return {
            days,
            hours,
            minutes,
            seconds,
            diffMs,
            isPast: diffMs < 0
        };
    }

    /**
     * YYYY-MM-DD 형식을 보기 좋은 YYYY. MM. DD. 형식으로 변환합니다.
     */
    function formatDateString(str) {
        const dt = new Date(str);
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return `${y}. ${m}. ${d}`;
    }

    /**
     * diff 값을 토대로 다이나믹하게 적용할 Tailwind 클래스 데이터들을 묶어냅니다.
     * 이제 정확한 시간 정보 객체인 diffObj를 받습니다.
     */
    function getStatusStyles(diffObj) {
        // [수정] D-Day 형태 구성
        let textFormat = '';
        if (diffObj.isPast) {
            textFormat = `D+${diffObj.days}`; // 지난 일정은 일수만 보여줌
        } else {
            textFormat = diffObj.days === 0 && diffObj.hours === 0 && diffObj.minutes === 0 && diffObj.seconds === 0
                         ? 'D-Day' 
                         : `D-${diffObj.days}`; // 아직 다가오고 있다면 D-일수 표시
        }
        
        // 날짜가 안 지났을 때 (목표일까지 남았을 때, 혹은 정확히 당일 자정)
        if (!diffObj.isPast && diffObj.diffMs > 0) {
            // 자정이 안 지났고 시간 차가 당일 자정에 한없이 가까워 일수가 0일 경우엔 좀 더 시트러스 톤에 가깝게
            if (diffObj.days === 0) {
                 return {
                    mainText: textFormat,
                    colorText: 'text-accent-citrus', // 당일은 맑은 시트러스 포인트
                    bgBadge: 'bg-accent-citrus/10',
                    border: 'border-accent-citrus/30',
                    icon: 'stars',
                    iconColor: 'text-accent-citrus',
                    statusWord: 'Today!'
                };
            }
            return {
                mainText: textFormat,
                colorText: 'text-primary',
                bgBadge: 'bg-primary/10',
                border: 'border-primary/20',
                icon: 'event_upcoming',
                iconColor: 'text-primary',
                statusWord: 'Upcoming'
            };
        } else {
            return {
                mainText: textFormat,
                colorText: 'text-slate-400',
                bgBadge: 'bg-slate-100',
                border: 'border-slate-200',
                icon: 'history',
                iconColor: 'text-slate-400',
                statusWord: 'Past'
            };
        }
    }


    // -----------------------------------------------------------------
    // 6. UI 렌더링 함수들
    // -----------------------------------------------------------------

    /**
     * DOM 전체를 재조립하지 않고, 카운트다운 시간(+D-Day상태문구) 텍스트만 1초마다 부분 업데이트합니다.
     */
    function updateCountdownsOnly() {
        if (ddays.length === 0) return;
        
        let sorted = [...ddays].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // 1. 히어로 카드 업데이트
        const heroItem = sorted[0];
        const heroDiffObj = getExactDiff(heroItem.date);
        const heroSt = getStatusStyles(heroDiffObj);
        
        const heroDdayEl = document.getElementById('hero-dday');
        const heroTimerEl = document.getElementById('hero-timer'); // 새롭게 추가할 전용 ID

        if (heroDdayEl) {
            heroDdayEl.textContent = heroSt.mainText;
            heroDdayEl.className = `text-4xl md:text-[2.75rem] font-extrabold tracking-tighter drop-shadow-sm transition-colors duration-300 ${heroSt.colorText} leading-none mb-1 mt-1`;
        }

        if (heroTimerEl && !heroDiffObj.isPast) {
            heroTimerEl.textContent = `${String(heroDiffObj.hours).padStart(2, '0')}:${String(heroDiffObj.minutes).padStart(2, '0')}:${String(heroDiffObj.seconds).padStart(2, '0')}`;
        }

        // 2. 리스트 아이템 업데이트
        const listItems = sorted.slice(1);
        listItems.forEach(item => {
            const listObj = getExactDiff(item.date);
            const listSt = getStatusStyles(listObj);

            // 미리 렌더링된 요소들을 id 기반으로 추적하여 텍스트만 변경
            const listMainEl = document.getElementById(`list-main-${item.id}`);
            const listTimerEl = document.getElementById(`list-timer-${item.id}`);

            if (listMainEl) {
                listMainEl.textContent = listSt.mainText;
            }
            if (listTimerEl && !listObj.isPast) {
                listTimerEl.textContent = `${String(listObj.hours).padStart(2, '0')}:${String(listObj.minutes).padStart(2, '0')}:${String(listObj.seconds).padStart(2, '0')}`;
            }
        });
    }

    /**
     * 앱의 UI 전체를 데이터 기반으로 무효화(리페인트) 합니다.
     * 새로운 일정이 추가되거나 삭제되었을 때만 호출됩니다.
     */
    function renderApp() {
        if (ddays.length === 0) {
            emptyState.classList.remove('hidden');
            heroContainer.classList.add('hidden');
            listContainer.classList.add('hidden');
            return;
        }

        // 아이템이 1개라도 있으면 빈 상태 숨김
        emptyState.classList.add('hidden');

        // [정렬] 일정을 과거~미래 순(날짜 오름차순)으로 정렬합니다. 직관성을 높이기 위함.
        let sorted = [...ddays].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 배열의 가장 첫 항목은 0순위(가장 빠른 과거 또는 가장 임박한 미래)이므로 히어로 카드로 격상
        renderHeroCard(sorted[0]);

        // 나머지 추가 일정들이 있다면 리스트 형태로 분리하여 출력합니다.
        if (sorted.length > 1) {
            listContainer.classList.remove('hidden');
            renderList(sorted.slice(1));
        } else {
            listContainer.classList.add('hidden');
        }
    }

    /**
     * 가장 비중있는 최상단 히어로 카드를 렌더링
     */
    function renderHeroCard(item) {
        const diffObj = getExactDiff(item.date);
        const st = getStatusStyles(diffObj);

        heroContainer.dataset.id = item.id;
        heroTitle.textContent = item.title;
        heroDate.innerHTML = `<span class="material-symbols-outlined text-base">calendar_month</span> ${formatDateString(item.date)}`;
        
        // 날짜 텍스트 (D-0, D-Day, D+0 등)와 하단 카운트다운 생성
        let countdownHTML = '';
        if (!diffObj.isPast) {
            // padStart로 시간을 항상 두자리로 표기 (00:00:00)
            const hh = String(diffObj.hours).padStart(2, '0');
            const mm = String(diffObj.minutes).padStart(2, '0');
            const ss = String(diffObj.seconds).padStart(2, '0');
            
            countdownHTML = `<div class="mt-2 flex items-center justify-center gap-1.5 text-${st.colorText.replace('text-', '')}/80 text-sm font-bold bg-white/70 px-3 py-1.5 rounded-full shadow-inner border border-white max-w-max mx-auto md:mx-0">
                                <span class="material-symbols-outlined text-[14px]">timer</span>
                                <span>${hh} : ${mm} : ${ss}</span>
                             </div>`;
        } else {
            // 과거인 경우 카운트다운 대신 심플한 텍스트
            countdownHTML = `<div class="mt-2 text-slate-400 text-xs font-semibold">종료된 일정입니다.</div>`;
        }

        heroDday.textContent = st.mainText;
        heroDday.className = `z-10 text-[3.2rem] font-extrabold tracking-tighter drop-shadow-sm transition-colors duration-300 ${st.colorText} leading-none mt-2`;
        
        // 시간 카운트다운을 표시하기 위해 기존 DOM 재배치 (히어로 D-Day 박스 내부 추가)
        heroDday.parentElement.innerHTML = `
            <span class="material-symbols-outlined absolute text-[120px] text-primary/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 z-0">event_available</span>
            <div class="flex flex-col items-center justify-center z-10 w-full h-full relative">
                <div id="hero-dday" class="text-4xl md:text-[2.75rem] font-extrabold tracking-tighter drop-shadow-sm transition-colors duration-300 ${st.colorText} leading-none mb-1 mt-1">${st.mainText}</div>
                ${!diffObj.isPast ? `<div id="hero-timer" class="text-xs font-bold tracking-widest text-${st.colorText.replace('text-', '')} bg-white/80 px-2 py-0.5 rounded shadow-sm border border-white tabular-nums">${String(diffObj.hours).padStart(2, '0')}:${String(diffObj.minutes).padStart(2, '0')}:${String(diffObj.seconds).padStart(2, '0')}</div>` : ''}
            </div>
        `;
        
        // 미니 상태 뱃지 업데이트
        heroStatus.textContent = st.statusWord;
        heroStatus.className = `text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap ${st.colorText} ${st.bgBadge}`;
        
        // 아이콘 동적 변경
        heroIcon.textContent = st.icon;
        heroIcon.className = `material-symbols-outlined text-base ${st.iconColor}`;

        heroContainer.classList.remove('hidden');
    }

    /**
     * 전체 일정 리스트를 동적으로 주입(Inject) 합니다. (디자인 레퍼런스의 리스트 UI 반영)
     */
    function renderList(listItems) {
        ddayList.innerHTML = ''; // 초기화

        listItems.forEach(item => {
            const diffObj = getExactDiff(item.date);
            const st = getStatusStyles(diffObj);

            // 시간 카운트다운 서브 텍스트 추가 (리스트용)
            let timeStr = '';
            if (!diffObj.isPast) {
                 timeStr = `<span class="text-xs font-semibold tabular-nums ml-2 opacity-80">${String(diffObj.hours).padStart(2, '0')}:${String(diffObj.minutes).padStart(2, '0')}:${String(diffObj.seconds).padStart(2, '0')}</span>`;
            }

            const row = document.createElement('div');
            // Tailwind를 활용한 각 요소들의 레이아웃 구성. group, hover 등의 인터랙티브 클래스를 적극 활용했습니다.
            row.className = "group relative flex items-start sm:items-center gap-5 py-5 border-b border-sage-100 dark:border-zinc-800 last:border-0 last:pb-0 first:pt-0";
            
            row.innerHTML = `
                <!-- 좌측 상태 뱃지 (원형) -->
                <div class="flex-shrink-0 z-10 w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-sm ring-1 ${st.border} ${st.bgBadge} transition-transform group-hover:scale-105">
                    <span id="list-main-${item.id}" class="text-[13px] font-extrabold ${st.colorText} leading-none mb-0.5">${st.mainText}</span>
                    ${!diffObj.isPast ? `<span id="list-timer-${item.id}" class="text-[9px] font-bold ${st.colorText} opacity-70 tabular-nums">${String(diffObj.hours).padStart(2, '0')}:${String(diffObj.minutes).padStart(2, '0')}:${String(diffObj.seconds).padStart(2, '0')}</span>` : ''}
                </div>
                
                <!-- 중앙 텍스트 영역 -->
                <div class="flex-1 pb-1">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h4 class="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-snug break-all">${item.title}</h4>
                        <span class="text-xs font-bold px-2 py-1 bg-sage-50 text-slate-600 rounded-md border border-sage-200 inline-block w-max whitespace-nowrap">
                            ${formatDateString(item.date)}
                        </span>
                    </div>
                </div>

                <!-- 우측 삭제 인터랙션 영역 -->
                <div class="flex-shrink-0 pt-1 sm:pt-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="delete-btn flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-red-100 hover:border-red-500" data-id="${item.id}" title="일정 삭제">
                        <span class="material-symbols-outlined text-xl transition-transform hover:scale-110">delete</span>
                    </button>
                </div>
            `;
            ddayList.appendChild(row);
        });

        // 리스트로 생성된 Delete 버튼들에 개별 이벤트 추가
        const deleteBtns = ddayList.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                openDeleteModal(id);
            });
        });
    }

    // -----------------------------------------------------------------
    // 7. 모달 트랜지션 / 애니메이션
    // -----------------------------------------------------------------

    function openDeleteModal(id) {
        currentDeleteId = id;
        deleteModal.classList.remove('hidden');
        
        // Tailwind 300ms transition이 작동할 수 있도록 1프레임 미룹니다.
        setTimeout(() => {
            deleteModalOverlay.classList.remove('opacity-0');
            deleteModalContent.classList.remove('opacity-0', 'scale-95');
        }, 10);
    }

    function closeDeleteModal() {
        deleteModalOverlay.classList.add('opacity-0');
        deleteModalContent.classList.add('opacity-0', 'scale-95');
        
        // 애니메이션이 완전히 끝날 때까지 300ms를 기다린 뒤 요소를 숨깁니다.
        setTimeout(() => {
            deleteModal.classList.add('hidden');
            currentDeleteId = null;
        }, 300);
    }
});
