const SCHEMES = {
  1: {
    categories: [
      { id: 'admin', name: 'Жалоба на администратора', hint: 'Для жалоб на действия администратора сервера.', fields: [
        f('yourNick','Ваш ник','Как вас зовут в игре.',true), f('adminNick','Ник администратора','Ник администратора, на которого подаётся жалоба.',true), f('reason','Суть жалобы','Подробно опишите ситуацию.',true,'textarea'), f('punishment','Наказание / причина','Укажите выданное наказание, если оно было.',false), f('alist','Скриншот наказания (/alist)','Ссылка на подтверждение наказания, если применимо.',false), f('proof','Ссылка на доказательства','Ссылка на видео или скриншоты.',true,'text','full') ] },
      { id: 'leaders', name: 'Жалоба на лидера / заместителя', hint: 'Для обращений на лидера или его заместителя.', fields: [
        f('yourNick','Ваш ник','Ваш игровой ник.',true), f('offenderNick','Ник лидера / заместителя','Ник игрока, на которого жалуетесь.',true), f('org','Организация','Название организации.',true), f('reason','Суть жалобы','Опишите нарушение и обстоятельства.',true,'textarea'), f('proof','Ссылка на доказательства','Видео или скриншоты.',true,'text','full') ] },
      { id: 'fines', name: 'Штрафы / розыск', hint: 'Для вопросов, связанных со штрафами или розыском.', fields: [
        f('yourNick','Ваш ник','Ваш игровой ник.',true), f('offenderNick','Ник сотрудника','Если известен.',false), f('reason','Суть жалобы','Что произошло и почему вы не согласны.',true,'textarea'), f('stats','Скриншот статистики (/c 060)','Добавьте, если это требуется правилами раздела.',false), f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full') ] },
      { id: 'civilian', name: 'Игрок не состоит в организации', hint: 'Жалоба на игрока, который не состоит в организации.', fields: [
        f('yourNick','Ваш ник','Ваш игровой ник.',true), f('offenderNick','Ник нарушителя','Игровой ник нарушителя.',true), f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'), f('stats','Скриншот статистики (/c 060)','Если требуется правилами раздела.',false), f('proof','Ссылка на доказательства','Ссылка на видео или скриншоты.',true,'text','full') ] },
      { id: 'government', name: 'Игрок состоит в государственной организации', hint: 'Жалоба на участника государственной организации.', fields: [
        f('yourNick','Ваш ник','Ваш игровой ник.',true), f('offenderNick','Ник нарушителя','Ник сотрудника.',true), f('org','Государственная организация','Название организации.',true), f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'), f('stats','Скриншот статистики (/c 060)','Если требуется правилами раздела.',false), f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full') ] },
      { id: 'criminal', name: 'Игрок состоит в криминальной организации', hint: 'Жалоба на участника криминальной организации.', fields: [
        f('yourNick','Ваш ник','Ваш игровой ник.',true), f('offenderNick','Ник нарушителя','Ник игрока.',true), f('org','Криминальная организация','Название организации.',true), f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'), f('stats','Скриншот статистики (/c 060)','Если требуется правилами раздела.',false), f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full') ] }
    ]
  },
  2: {
    categories: [
      { id: 'admin', name: 'Жалоба на администратора', hint: 'Жалоба на действия администратора.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('adminNick','Ник администратора','Ник администратора.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('punishment','Наказание','Укажите тип и причину, если применимо.',false),f('alist','Скриншот наказания (/alist)','Ссылка на скриншот, если применимо.',false),f('proof','Ссылка на доказательства','Видео или скриншоты.',true,'text','full')]},
      { id: 'leaders', name: 'Жалоба на лидера / заместителя', hint: 'Жалоба на лидера или заместителя организации.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник лидера / заместителя','Ник игрока.',true),f('org','Организация','Название организации.',true),f('reason','Суть жалобы','Опишите нарушение.',true,'textarea'),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]},
      { id: 'mvd', name: 'МВД / ФСБ', hint: 'Жалоба на сотрудника МВД или ФСБ.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник сотрудника','Ник сотрудника МВД / ФСБ.',true),f('org','Подразделение','МВД или ФСБ.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('stats','Скриншот статистики','Добавьте, если требуется правилами.',false),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]},
      { id: 'inorg', name: 'Игрок состоит в организации', hint: 'Жалоба на участника организации.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник нарушителя','Ник игрока.',true),f('org','Организация','Название организации.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]},
      { id: 'outorg', name: 'Игрок не состоит в организации', hint: 'Жалоба на игрока без организации.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник нарушителя','Ник игрока.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]},
      { id: 'gang', name: 'Жалоба на участника банды', hint: 'Жалоба на участника банды.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник нарушителя','Ник игрока.',true),f('org','Название банды','Название банды.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]},
      { id: 'scam', name: 'Обман игрока', hint: 'Жалоба на игрока, который обманул вас при договорённости или обмене.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник игрока','Ник игрока, на которого подаётся жалоба.',true),f('reason','Как произошёл обман','Опишите, о чём договорились и что в итоге произошло.',true,'textarea'),f('proof','Доказательства','Ссылка на скриншоты переписки, сделки или видео.',true,'text','full')]}
    ]
  },
  3: {
    categories: [
      { id: 'admin', name: 'Жалоба на администратора', hint: 'Жалоба на действия администратора.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('adminNick','Ник администратора','Ник администратора.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('alist','Скриншот (/alist)','Ссылка на подтверждение наказания, если применимо.',false),f('proof','Ссылка на доказательства','Видео или скриншоты.',true,'text','full')]},
      { id: 'leaders', name: 'Жалоба на лидера / заместителя', hint: 'Жалоба на лидера или заместителя.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник лидера / заместителя','Ник игрока.',true),f('org','Организация','Название организации.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]},
      { id: 'mvd', name: 'МВД / ФСБ', hint: 'Жалоба на сотрудника МВД или ФСБ.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник сотрудника','Ник сотрудника.',true),f('org','Подразделение','МВД или ФСБ.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('stats','Скриншот статистики (/c 060)','Проверь требования раздела.',false),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]},
      { id: 'mafia', name: 'Мафия / банда', hint: 'Жалоба на участника мафии или банды.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник нарушителя','Ник игрока.',true),f('org','Мафия / банда','Название организации.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('stats','Скриншот статистики (/c 060)','Если требуется правилами.',false),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]},
      { id: 'outorg', name: 'Игрок не состоит в организации', hint: 'Жалоба на игрока без организации.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник нарушителя','Ник игрока.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('stats','Скриншот статистики (/c 060)','Если требуется правилами.',false),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]},
      { id: 'inorg', name: 'Игрок состоит в организации', hint: 'Жалоба на участника организации.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник нарушителя','Ник игрока.',true),f('org','Организация','Название организации.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('stats','Скриншот статистики (/c 060)','Если требуется правилами.',false),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]},
      { id: 'fsin', name: 'ФСИН', hint: 'Жалоба на сотрудника или участника ФСИН.', fields: [f('yourNick','Ваш ник','Ваш игровой ник.',true),f('offenderNick','Ник сотрудника','Ник сотрудника ФСИН.',true),f('reason','Суть жалобы','Опишите ситуацию.',true,'textarea'),f('mn','Скриншот (/mn)','Добавьте требуемое подтверждение, если применимо.',false),f('stats','Скриншот статистики (/c 60)','Проверьте требования раздела.',false),f('proof','Ссылка на доказательства','Ссылка на материалы.',true,'text','full')]}
    ]
  },
  4: {
    categories: [
      { id: 'admin', name: 'Жалоба на администратора', hint: 'Жалоба на действия администратора.', fields: [f('yourNick','Ваш ник','',true),f('adminNick','Ник администратора','',true),f('punishment','Вид наказания','',true,'select','',['Mute','Jail','Warn','Ban','Другое']),f('reason','Причина жалобы','',true,'textarea'),f('alist','Скриншот наказания (/alist)','',true,'link'),f('proof','Дополнительные доказательства','',false,'link','full')]},
      { id: 'scam', name: 'Обман игрока', hint: 'Жалоба на обман игрока.', fields: [f('yourNick','Ваш ник','',true),f('offenderNick','Ник игрока','',true),f('reason','Как произошёл обман','',true,'textarea'),f('stats','Скриншот статистики','',false,'link'),f('proof','Доказательства','',true,'link','full')]},
      { id: 'leaders', name: 'Жалоба на лидера / заместителя', hint: 'Жалоба на лидера или заместителя.', fields: [f('yourNick','Ваш ник','',true),f('offenderNick','Ник лидера / заместителя','',true),f('org','Организация','',true),f('reason','Суть жалобы','',true,'textarea'),f('stats','Скриншот статистики','',false,'link'),f('proof','Доказательства','',true,'link','full')]},
      { id: 'government', name: 'Государственная организация', hint: 'Жалоба на участника государственной организации.', fields: [f('yourNick','Ваш ник','',true),f('offenderNick','Ник сотрудника','Точный игровой ник сотрудника, на которого подаёшь жалобу.',true),f('org','Государственная организация','',true),f('reason','Суть жалобы','',true,'textarea'),f('stats','Скриншот статистики','',false,'link'),f('proof','Доказательства','',true,'link','full')]},
      { id: 'fsin', name: 'ФСИН', hint: 'Шаблон жалобы для Тюрьмы ФСИН.', fields: [f('recipientName','Имя Фамилия руководителя','Впиши имя и фамилию начальника / генерала, которому адресована жалоба.',true),f('applicantName','Ваше имя Фамилия','Твои имя и фамилия для строки «От».',true),f('yourNick','Ваш игровой ник','Твой точный игровой ник, как в игре.',true),f('offenderNick','Ник сотрудника','Точный игровой ник сотрудника, на которого подаёшь жалобу.',true),f('violation','Что нарушил сотрудник','Кратко укажи, какое правило или действие сотрудник нарушил. Пиши по фактам.',true,'textarea'),f('evidence','Доказательство','Вставь ссылку на видео или скриншоты. Проверь, что материалы открываются.',true,'link','full'),f('date','Дата','Дата подачи жалобы. Можно оставить сегодняшнюю дату.',true,'date'),f('signature','Подпись','Обычно укажи своё имя Фамилию или игровой ник — как принято в разделе.',true)]},
      { id: 'fsb', name: 'ФСБ', hint: 'Шаблон жалобы генералу ФСБ.', fields: [f('recipientName','Имя Фамилия генерала','Впиши имя и фамилию генерала, которому адресуется жалоба.',true),f('applicantName','Ваше имя Фамилия','Твои имя и фамилия для строки «От».',true),f('yourNick','Ваш игровой ник','Твой точный игровой ник, как в игре.',true),f('offenderNick','Ник сотрудника','Точный игровой ник сотрудника, на которого подаёшь жалобу.',true),f('violation','Что нарушил сотрудник','Кратко укажи, какое правило или действие сотрудник нарушил. Пиши по фактам.',true,'textarea'),f('evidence','Доказательство','Вставь ссылку на видео или скриншоты. Проверь, что материалы открываются.',true,'link','full'),f('date','Дата','Дата подачи жалобы. Можно оставить сегодняшнюю дату.',true,'date'),f('signature','Подпись','Обычно укажи своё имя Фамилию или игровой ник — как принято в разделе.',true)]},
      { id: 'mvd', name: 'МВД', hint: 'Шаблон жалобы генералу МВД.', fields: [f('recipientName','Имя Фамилия генерала','Впиши имя и фамилию генерала, которому адресуется жалоба.',true),f('applicantName','Ваше имя Фамилия','Твои имя и фамилия для строки «От».',true),f('yourNick','Ваш игровой ник','Твой точный игровой ник, как в игре.',true),f('offenderNick','Ник сотрудника','Точный игровой ник сотрудника, на которого подаёшь жалобу.',true),f('violation','Что нарушил сотрудник','Кратко укажи, какое правило или действие сотрудник нарушил. Пиши по фактам.',true,'textarea'),f('evidence','Доказательство','Вставь ссылку на видео или скриншоты. Проверь, что материалы открываются.',true,'link','full'),f('date','Дата','Дата подачи жалобы. Можно оставить сегодняшнюю дату.',true,'date'),f('signature','Подпись','Обычно укажи своё имя Фамилию или игровой ник — как принято в разделе.',true)]},
      { id: 'gang', name: 'Банда', hint: 'Жалоба на участника банды.', fields: [f('yourNick','Ваш ник','',true),f('offenderNick','Ник нарушителя','',true),f('org','Название банды','',true),f('reason','Суть жалобы','',true,'textarea'),f('stats','Скриншот статистики','',false),f('proof','Доказательства','',true,'link','full')]}
    ]
  },
  5: {
    categories: [
      { id: 'admin', name: 'Жалоба на администратора', hint: 'Жалоба на действия администратора сервера 05.', fields: [
        f('yourNick','Ваш ник','Ваш игровой ник.',true),
        f('adminNick','Ник администратора','Ник администратора, на которого подаётся жалоба.',true),
        f('reason','Суть жалобы','Подробно опишите ситуацию и нарушение.',true,'textarea'),
        f('alist','Скриншот / видео выдачи наказания (/alist)','Ссылка на скриншот или видео выдачи наказания.',true,'text','full')
      ]},
      { id: 'leaders', name: 'Жалоба на лидера / заместителя', hint: 'Жалоба на лидера или заместителя организации.', fields: [
        f('yourNick','Ваш игровой никнейм','Ваш ник в игре.',true),
        f('offenderNick','Никнейм нарушителя','Ник лидера или заместителя.',true),
        f('reason','Подробное описание нарушения','Опишите нарушение по пунктам.',true,'textarea'),
        f('org','Организация нарушителя','Организация, в которой состоит нарушитель.',true),
        f('stats','Скриншот статистики + /c 060','Добавьте скриншот статистики персонажа с командой /c 060.',true,'text','full'),
        f('proof','Прилагаемые доказательства','Ссылки на видео или скриншоты.',true,'text','full')
      ]},
      { id: 'mvd', name: 'МВД / ФСБ', hint: 'Жалоба на сотрудника МВД или ФСБ.', fields: [
        f('yourNick','Ваш ник','Ваш игровой ник.',true),
        f('offenderNick','Ник нарушителя','Ник сотрудника.',true),
        f('reason','Описание нарушения','Опишите действия сотрудника.',true,'textarea'),
        f('stats','Скриншот игровой статистики + /c 060','Ссылка на скриншот статистики с /c 060.',true,'text','full'),
        f('proof','Доказательства','Скриншот выдачи звёзд, штрафа, информации о штрафе или системного штрафа с /c 060.',true,'text','full'),
        f('timecodes','Тайм-коды','Заполните, если видео длится больше 60 секунд.',false,'textarea','full')
      ]},
      { id: 'inorg', name: 'Жалоба на состоящего в организации', hint: 'Жалоба на игрока, который состоит в организации.', fields: [
        f('yourNick','Ваш ник','Ваш игровой ник.',true),
        f('offenderNick','Ник нарушителя','Ник игрока.',true),
        f('reason','Описание нарушения','Опишите ситуацию.',true,'textarea'),
        f('org','Организация нарушителя','Организация, в которой состоит нарушитель.',true),
        f('stats','Скриншот игровой статистики + /c 060','Ссылка на скриншот статистики с /c 060.',true,'text','full'),
        f('proof','Прилагаемые доказательства','Ссылки на видео или скриншоты.',true,'text','full'),
        f('timecodes','Тайм-коды','Заполните, если видео длится больше 60 секунд.',false,'textarea','full')
      ]},
      { id: 'outorg', name: 'Жалоба на не состоящего в организации', hint: 'Жалоба на игрока, который не состоит в организации.', fields: [
        f('yourNick','Ваш ник','Ваш игровой ник.',true),
        f('offenderNick','Ник нарушителя / ID маски','Укажите ник или ID маски нарушителя.',true),
        f('reason','Описание нарушения','Опишите ситуацию.',true,'textarea'),
        f('stats','Скриншот игровой статистики + /c 060','Ссылка на скриншот статистики с /c 060.',true,'text','full'),
        f('proof','Прилагаемые доказательства','Ссылки на видео или скриншоты.',true,'text','full'),
        f('timecodes','Тайм-коды','Заполните, если видео длится больше 60 секунд.',false,'textarea','full')
      ]},
      { id: 'gang', name: 'Банды / мафии', hint: 'Жалоба на участника банды или мафии.', fields: [
        f('yourNick','Ваш ник','Ваш игровой ник.',true),
        f('offenderNick','Ник нарушителя / ID маски','Укажите ник или ID маски нарушителя.',true),
        f('reason','Описание нарушения','Опишите ситуацию.',true,'textarea'),
        f('org','Название мафии / банды','Необязательное поле — укажите организацию, если знаете.',false),
        f('stats','Скриншот игровой статистики + /c 060','Ссылка на скриншот статистики с /c 060.',true,'text','full'),
        f('proof','Прилагаемые доказательства','Ссылки на видео или скриншоты.',true,'text','full'),
        f('timecodes','Тайм-коды','Заполните, если видео длится больше 60 секунд.',false,'textarea','full')
      ]}
    ]
  }
};

function f(id,label,hint,required=false,type='text',width='',options=[]) { return {id,label,hint,required,type,width,options}; }

let selectedServer = 1;
let currentResult = '';
const serverGrid = document.getElementById('server-grid');
const categorySelect = document.getElementById('category-select');
const fieldsContainer = document.getElementById('dynamic-fields');
const form = document.getElementById('complaint-form');
const resultText = document.getElementById('result-text');
const resultWrap = document.getElementById('result-wrap');
const emptyState = document.getElementById('empty-state');
const copyButton = document.getElementById('copy-button');
const toast = document.getElementById('toast');
const outputStatus = document.getElementById('output-status');

const HELP_TEXT = {
  yourNick: 'Впиши свой игровой ник точно, с теми же буквами и символами, что в игре.',
  adminNick: 'Укажи точный ник администратора. Не подставляй сюда свой ник.',
  offenderNick: 'Укажи точный игровой ник человека, на которого подаёшь жалобу.',
  recipientName: 'Имя и фамилия руководителя, которому адресуется заявление.',
  applicantName: 'Твои имя и фамилия для строки «От».',
  reason: 'Опиши своими словами: что случилось, примерно когда и кто участвовал. Без оскорблений — только факты.',
  violation: 'Напиши, что именно сделал сотрудник и какое правило, по твоему мнению, он нарушил.',
  proof: 'Вставь ссылку на видео или скриншоты. Перед отправкой открой её и проверь, что материалы доступны.',
  evidence: 'Вставь ссылку на видео или скриншоты. Проверь, что ссылка открывается у других людей.',
  alist: 'Ссылка на скриншот наказания из /alist. Если раздел требует его, добавь ссылку сюда.',
  stats: 'Ссылка на скриншот статистики персонажа. Добавляй, когда это требуется правилами раздела.',
  org: 'Напиши полное название организации или подразделения.',
  date: 'Дата подачи жалобы. Можно оставить сегодняшнюю дату.',
  signature: 'Укажи подпись так, как принято в правилах раздела: имя и фамилию или игровой ник.'
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function getCategory() {
  return SCHEMES[selectedServer].categories.find(item => item.id === categorySelect.value);
}

function draftKey() {
  return `forumnik-draft-${selectedServer}-${categorySelect.value}`;
}

function localDateValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function displayDate(value) {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}

function saveDraft() {
  const fields = {};
  const category = getCategory();
  if (!category) return;
  for (const field of category.fields) {
    const input = document.getElementById(`field-${field.id}`);
    if (input) fields[field.id] = input.value;
  }
  try {
    localStorage.setItem(draftKey(), JSON.stringify(fields));
    document.getElementById('draft-status').textContent = 'Черновик сохраняется на этом ПК';
  } catch (error) {
    document.getElementById('draft-status').textContent = 'Автосохранение недоступно';
  }
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(draftKey());
    if (!raw) return;
    const saved = JSON.parse(raw);
    for (const [id, value] of Object.entries(saved)) {
      const input = document.getElementById(`field-${id}`);
      if (input && typeof value === 'string') input.value = value;
    }
  } catch (error) {
    showToast('Не удалось восстановить черновик. Можно заполнить форму заново.');
  }
  updateTextCounters();
}

function updateTextCounters() {
  fieldsContainer.querySelectorAll('textarea.field-control').forEach(input => {
    const counter = document.getElementById(`${input.id}-counter`);
    if (counter) counter.textContent = `${input.value.length} символов`;
  });
}

function renderCategories() {
  const categories = SCHEMES[selectedServer].categories;
  categorySelect.innerHTML = categories.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
  renderFields();
}

function renderFields() {
  const category = getCategory();
  if (!category) return;
  document.getElementById('category-hint').textContent = category.hint;
  fieldsContainer.innerHTML = category.fields.map(field => {
    const id = `field-${field.id}`;
    const requiredMark = field.required ? ' <span class="required">*</span>' : '';
    const help = field.hint || HELP_TEXT[field.id] || 'Заполни это поле, если информация есть.';
    let control = '';
    if (field.type === 'textarea') {
      control = `<textarea class="field-control textarea" id="${id}" name="${field.id}" placeholder="Напиши здесь..."></textarea><div class="field-meta"><span>Можно писать своими словами</span><span id="${id}-counter">0 символов</span></div>`;
    } else if (field.type === 'select') {
      const options = (field.options || []).map(option => `<option value="${option}">${option}</option>`).join('');
      control = `<select class="field-control" id="${id}" name="${field.id}"><option value="">Выбери вариант</option>${options}</select>`;
    } else if (field.type === 'date') {
      control = `<div class="input-with-action"><input class="field-control" id="${id}" name="${field.id}" type="date" value="${localDateValue()}" /><button class="inline-action" type="button" data-date-for="${id}">Сегодня</button></div>`;
    } else {
      const placeholder = field.type === 'link' ? 'Вставь ссылку на материал...' : 'Введи значение...';
      control = `<input class="field-control" id="${id}" name="${field.id}" type="text" placeholder="${placeholder}" autocomplete="off" />`;
    }
    return `<div class="field-group ${field.width === 'full' ? 'full' : ''}"><label for="${id}">${field.label}${requiredMark}</label>${control}<small>${help}</small></div>`;
  }).join('');
  restoreDraft();
  resetResult();
}

function resetResult() {
  currentResult = '';
  resultWrap.classList.add('hidden');
  emptyState.classList.remove('hidden');
  copyButton.disabled = true;
  document.getElementById('download-button').disabled = true;
  outputStatus.textContent = 'Ожидает заполнения';
}

function collectValues(category) {
  const values = {};
  for (const field of category.fields) {
    const input = document.getElementById(`field-${field.id}`);
    const value = input ? input.value.trim() : '';
    values[field.id] = field.type === 'date' ? displayDate(value) : value;
    if (field.required && !value) {
      showToast(`Заполни поле «${field.label}».`);
      input?.focus();
      return null;
    }
  }
  return values;
}

function buildInstitutionComplaint(category, values) {
  let heading = '';
  if (category.id === 'fsin') {
    heading = `Начальнику Тюрьмы Федеральной Службы Исполнения Наказаний Нижегородской области, ${values.recipientName}`;
  } else if (category.id === 'fsb') {
    heading = `Генералу Федеральной Службы Безопасности Нижегородской области\n${values.recipientName}`;
  } else {
    heading = `Генералу Министерства Внутренних Дел по Нижегородской области\n${values.recipientName}`;
  }
  return [
    heading,
    '',
    `От: ${values.applicantName}`,
    `Я, "${values.yourNick}" прошу рассмотреть мою жалобу на "${values.offenderNick}".`,
    'К своему заявлению прикладываю следующие документы:',
    '1. Ксерокопия паспорта ((/pass)):',
    `2. Что нарушил сотрудник: ${values.violation}`,
    `3. Доказательство: ${values.evidence}`,
    `4. Дата: ${values.date}`,
    `5. Подпись: ${values.signature}`
  ].join('\n');
}

const TITLES = {
  admin: 'Жалоба на администратора',
  leaders: 'Жалоба на лидера / заместителя',
  fines: 'Жалоба на штраф / розыск',
  civilian: 'Жалоба на игрока без организации',
  government: 'Жалоба на участника государственной организации',
  criminal: 'Жалоба на участника криминальной организации',
  mvd: 'Жалоба на сотрудника МВД',
  fsb: 'Жалоба на сотрудника ФСБ',
  inorg: 'Жалоба на участника организации',
  outorg: 'Жалоба на игрока без организации',
  gang: 'Жалоба на участника банды',
  scam: 'Жалоба на игрока (обман)',
  mafia: 'Жалоба на участника мафии / банды',
  fsin: 'Жалоба на сотрудника ФСИН'
};

function buildGeneralComplaint(category, values) {
  const lines = [
    TITLES[category.id] || category.name,
    `Сервер: ${String(selectedServer).padStart(2, '0')}`,
    ''
  ];
  for (const field of category.fields) {
    const value = values[field.id];
    if (!value) continue;
    let label = field.label;
    if (field.id === 'reason') {
      label = category.id === 'scam' ? 'Как произошёл обман' :
        category.id === 'admin' ? 'Описание ситуации и причина жалобы' : 'Описание ситуации';
    } else if (field.id === 'yourNick') label = 'Ваш ник';
    else if (field.id === 'adminNick') label = 'Ник администратора';
    else if (field.id === 'offenderNick') label = category.id === 'mvd' ? 'Ник сотрудника' : 'Ник нарушителя';
    else if (field.id === 'org') label = category.id === 'mvd' ? 'Подразделение' : 'Организация';
    else if (field.id === 'punishment') label = 'Вид наказания';
    else if (field.id === 'alist') label = 'Скриншот наказания (/alist)';
    else if (field.id === 'stats') label = 'Скриншот статистики';
    else if (field.id === 'proof') label = 'Доказательства';
    lines.push(`${label}: ${value}`);
  }
  const closingText = category.id === 'admin'
    ? 'Прошу проверить действия администратора и принять решение по правилам сервера.'
    : category.id === 'scam'
      ? 'Прошу разобраться в ситуации с обманом и принять меры по правилам сервера.'
      : category.id === 'mvd'
        ? 'Прошу проверить действия сотрудника и принять решение по правилам сервера.'
        : 'Прошу рассмотреть жалобу и принять решение по правилам сервера.';
  lines.push('', closingText);
  return lines.join('\n');
}

serverGrid.addEventListener('click', event => {
  const button = event.target.closest('[data-server]');
  if (!button) return;
  selectedServer = Number(button.dataset.server);
  serverGrid.querySelectorAll('.server-card').forEach(card => card.classList.toggle('selected', card === button));
  renderCategories();
});

categorySelect.addEventListener('change', renderFields);

fieldsContainer.addEventListener('input', event => {
  if (event.target.matches('textarea')) updateTextCounters();
  saveDraft();
});
fieldsContainer.addEventListener('change', saveDraft);

fieldsContainer.addEventListener('click', event => {
  const button = event.target.closest('[data-date-for]');
  if (!button) return;
  const input = document.getElementById(button.dataset.dateFor);
  if (input) {
    input.value = localDateValue();
    saveDraft();
  }
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const category = getCategory();
  if (!category) return;
  const values = collectValues(category);
  if (!values) return;

  currentResult = selectedServer === 4 && ['fsin', 'fsb', 'mvd'].includes(category.id)
    ? buildInstitutionComplaint(category, values)
    : buildGeneralComplaint(category, values);

  resultText.textContent = currentResult;
  document.getElementById('result-server').textContent = `СЕРВЕР ${String(selectedServer).padStart(2, '0')}`;
  document.getElementById('result-category').textContent = category.name.toUpperCase();
  emptyState.classList.add('hidden');
  resultWrap.classList.remove('hidden');
  copyButton.disabled = false;
  document.getElementById('download-button').disabled = false;
  outputStatus.textContent = 'Текст сформирован';
  showToast('Готово. Проверь текст и ссылки перед отправкой.');
});

document.getElementById('reset-button').addEventListener('click', () => {
  const category = getCategory();
  try { localStorage.removeItem(draftKey()); } catch (error) { /* local draft is optional */ }
  form.reset();
  if (category) {
    for (const field of category.fields) {
      if (field.type === 'date') {
        const input = document.getElementById(`field-${field.id}`);
        if (input) input.value = localDateValue();
      }
    }
  }
  updateTextCounters();
  resetResult();
  document.getElementById('draft-status').textContent = 'Черновик очищен';
  showToast('Поля и сохранённый черновик очищены');
});

copyButton.addEventListener('click', async () => {
  if (!currentResult) return;
  try {
    if (window.pywebview?.api?.copy_text) {
      const response = await window.pywebview.api.copy_text(currentResult);
      if (!response?.ok) throw new Error(response?.error || 'Не удалось скопировать');
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(currentResult);
    } else {
      const helper = document.createElement('textarea');
      helper.value = currentResult;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      const copied = document.execCommand('copy');
      helper.remove();
      if (!copied) throw new Error('Clipboard fallback failed');
    }
    showToast('Текст скопирован');
  } catch (error) {
    showToast('Не удалось скопировать. Выдели текст в окне результата вручную.');
  }
});

document.getElementById('download-button').addEventListener('click', async () => {
  if (!currentResult) return;
  const filename = `Forumnik_server_${String(selectedServer).padStart(2, '0')}_${categorySelect.value}.txt`;
  try {
    if (window.pywebview?.api?.save_text_file) {
      const response = await window.pywebview.api.save_text_file(currentResult, filename);
      if (response?.cancelled) return;
      if (!response?.ok) throw new Error(response?.error || 'Не удалось сохранить файл');
      showToast('TXT-файл сохранён');
      return;
    }
    const blob = new Blob(['\uFEFF', currentResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('TXT-файл подготовлен');
  } catch (error) {
    showToast('Не удалось сохранить файл. Попробуй скопировать текст.');
  }
});

document.getElementById('help-toggle').addEventListener('click', () => {
  const panel = document.getElementById('quick-help');
  const expanded = panel.classList.toggle('expanded');
  document.getElementById('help-toggle').setAttribute('aria-expanded', String(expanded));
  document.getElementById('help-toggle').textContent = expanded ? 'Скрыть инструкцию' : 'Как пользоваться?';
});

function openPage(page) {
  document.querySelectorAll('.page-view').forEach(view => view.classList.toggle('hidden', view.id !== `page-${page}`));
  document.querySelectorAll('.nav-item[data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === page));
  const labels = {home:'Главная',complaints:'Жалобы',join:'Заявка на вступление',updates:'Обновления',support:'Поддержать разработчика',settings:'Настройки',about:'О программе'};
  document.title = `Forumnik 1.4 — ${labels[page] || 'Главная'}`;
  window.scrollTo({top:0,behavior:'instant'});
}

document.querySelectorAll('.nav-item[data-page]').forEach(button => button.addEventListener('click', () => {
  const page = button.dataset.page;
  if (page === 'join') showToast('Раздел появится в следующих обновлениях');
  openPage(page);
}));
document.querySelectorAll('[data-open-page]').forEach(button => button.addEventListener('click', () => openPage(button.dataset.openPage)));
document.getElementById('share-button').addEventListener('click', async () => {
  const link = 'https://github.com/L1ton47/Forumnik/releases';
  try {
    if (window.pywebview?.api?.copy_text) {
      const result = await window.pywebview.api.copy_text(link);
      if (!result?.ok) throw new Error('copy failed');
    } else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(link);
    else throw new Error('clipboard unavailable');
    showToast('Ссылка на загрузку скопирована');
  } catch (error) { showToast('Не удалось скопировать ссылку'); }
});

openPage('home');
renderCategories();
