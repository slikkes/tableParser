const dodler = {
  state: {
    root: null,
    isOpen: false,
    isListening: false,
    withHeaders: true,
    tableHeaders: [],
    search: null,
    sort:{
      idx: null,
      asc: true
    },
    tableData:{
      headers:[],
      data:{}
    }
  },
  init(){
    this._addStyleSheet()

    const root = this.viewService.createElement('div', document.body, {className:"dodler-root"});

    this._createToggleBtn(root)
    this._createContent(root)
  },
  _createToggleBtn(root){
    const btnHolder = this.viewService.createElement('div', root, {className:"btnHolder"});
    const toggleBtn = this.viewService.createElement('button', btnHolder, {id:"toggleBtn"});

    toggleBtn.onclick = ()=>{
      root.style.width="auto";
      root.style.height="auto";
      root.classList.toggle('active')
    }
  },
  _createContent(root){

    const contentRoot = this.viewService.createElement('div', root, {id:"contentRoot"});
    const headerInputs = this.viewService.createElement('div', contentRoot, {id:"headerInputs"});

    const rightCol = this.viewService.createElement('div', contentRoot, {
      style:{display: 'flex', flexDirection: 'column'}
    });
    const outputArea = this.viewService.createElement('textarea', rightCol, {
      id:"outputArea",className:'text-box',disabled: true
    });
    const actionBtn = this.viewService.createElement('button', rightCol, {id:"actionBtn"});

    const getTableData = (event)=>{
      let res = this.tableParser.parseFromClick(event)

      if(!res.success){
        outputArea.innerHTML = res.msg
        return;
      }

      this.state.tableData = res;
      this._refreshHeaderInputs(res.headers[0], res.data.maxCol);
      this._updateOutput();

      actionBtn.click();
    }

    actionBtn.onclick = ()=>{
      if (this.state.isListening) {
        document.body.removeEventListener('click',getTableData)
        actionBtn.classList.toggle('on')
      }else{
        document.body.addEventListener('click',getTableData)
        actionBtn.classList.toggle('on')
      }
      this.state.isListening = !this.state.isListening;
    }


    this.state.root = root;

  },
  _refreshHeaderInputs(headers, maxCol, defMode){
    const inputWrapper = this.state.root.querySelector('#headerInputs');
    inputWrapper.innerHTML = "";

    this.state.sort = { key: null, asc: true }
    this.state.tableHeaders = [];
    this.state.search = null;

    const searchLine = this.viewService.createElement('div', inputWrapper, {style: {display:'flex',backgroundColor: '#5302c936'}});
    const search = this.viewService.createElement('input', searchLine, {type:'text', className: 'text-box', placeholder: 'search...'});
    search.addEventListener('input', event=>{
      this.state.search = event.target.value
      this._updateOutput();
    })

    const mainLine = this.viewService.createElement('div', inputWrapper, {style: {display:'flex',backgroundColor: '#5302c936', marginBottom: '4px'}});
    const selAllBox = this.viewService.createElement('input', mainLine, {type:'checkbox', checked: true});

    selAllBox.addEventListener('change', event=>{
      this.state.tableHeaders = this.state.tableHeaders
      .map(item=>{
        item.show =  event.target.checked;
        return item;
      })

      for (var checkBox of inputWrapper.querySelectorAll("input[type=checkbox]")) {
        checkBox.checked = event.target.checked;
        checkBox.parentElement.style.opacity = event.target.checked ? 1 : 0.6
      }
      this._updateOutput();
    })

    const modeSelect = this.viewService.createElement('select', mainLine, {className: 'text-box', style: {width:'172px'}});

    modeSelect.addEventListener('change', event=>{
      if(event.target.value != -1){
        this.state.withHeaders = true
        this._refreshHeaderInputs(this.state.tableData.headers[event.target.value],maxCol,event.target.value)
      }else{
        this.state.withHeaders = false
      }
      this._updateOutput();
    })

    this.viewService.createElement('option', modeSelect, {value: -1,innerHTML: 'no keys'});
    const opts = [...Array(this.state.tableData.headers.length).keys()]
    .map(idx => this.viewService.createElement('option', modeSelect, {value: idx,innerHTML: `${idx+1}. header`}))

    modeSelect.value = defMode || opts[0].value

    const sortDirBtn = this.viewService.createElement('button', mainLine, {
      innerHTML: this.state.sort.asc ? "↥" : "↧"
    });

    sortDirBtn.addEventListener('click', event=>{
      this.state.sort.asc = !this.state.sort.asc
      sortDirBtn.innerHTML = this.state.sort.asc ? "↥" : "↧"
      this._updateOutput()
    })

    const inputs = [...Array(maxCol).keys()].map(idx=>{
      const item = this.viewService.createElement('div', inputWrapper, {style: {display: 'flex'}});
      const checkBox = this.viewService.createElement('input', item, {
        type: 'checkbox', checked: true, className: 'text-box'
      });

      const input = this.viewService.createElement('input', item, {
        className: 'text-box', value: headers[idx] || null
      });
      this.state.tableHeaders.push({show:true, value:input.value})

      const radio = this.viewService.createElement('input', item, {
        type: 'radio', name: "sortkey", value: input.value
      });


      input.addEventListener('input', event=>{
        this.state.tableHeaders[idx].value = event.target.value.trim()
        this._updateOutput();
      })

      checkBox.addEventListener('change', event=>{
        this.state.tableHeaders[idx].show = event.target.checked
        event.target.parentElement.style.opacity = event.target.checked ? 1 : 0.6
        this._updateOutput();
      })

      radio.addEventListener('change', event=>{
        this.state.sort.idx = idx
        this._updateOutput()
      })
    })
  },
  _updateOutput(){
    let data = this.state.tableData.data.lines;

    if(this.state.search){
      data = data.filter(line=>line.join("#").toLowerCase().includes(this.state.search))
    }

    const outputArea = this.state.root.querySelector("#outputArea")
    if (!this.state.withHeaders) {
      data = data.map(line=>{
        return line.reduce((carry,value,idx)=>{
          if(this.state.tableHeaders[idx]?.show){
            carry.push(value);
          }
          return carry;
        },[])
      })

      if(this.state.tableHeaders.filter(i=>i.show).length == 1){
        data = data.flat()
      }
      outputArea.innerHTML = JSON.stringify(data);
      return
    }

    data = data.map(line=>{
      return line.reduce((carry,value,idx)=>{
        const key = this.state.tableHeaders[idx]?.value || idx;

        if(this.state.tableHeaders[idx]?.show){
          carry[key] = value;
        }

        return carry;
      },{})
    })
    if(this.state.sort.idx != null){
      const sortKey = this.state.tableHeaders[this.state.sort.idx].value;
      data = data.sort((a,b)=>{

        if(!!a[sortKey] && (isNaN(a[sortKey]) || isNaN(b[sortKey]))){
          if(this.state.sort.asc){
            return a[sortKey].localeCompare(b[sortKey]);
          }
          return b[sortKey].localeCompare(a[sortKey]);
        }

        const dir = this.state.sort.asc ? 1 : -1
        return (parseInt(a[sortKey]) - parseInt(b[sortKey])) * dir;
      })
    }
    outputArea.innerHTML = JSON.stringify(data);

  },
  tableParser:{
    parseFromClick(event){
      if(['td','th'].includes(event.target.tagName.toLowerCase())){

        const table = event.target.parentElement.parentElement.parentElement;
        if(table.tagName.toLowerCase() != 'table'){
          return {success:false, msg:'bad table ' + table.tagName}
        }


        return {
          success:true,
          headers: this.parseHeaders(table),
          data:this.parseTable(table)
        };
      }

      return {success:false, msg:event.target.tagName}
    },
    parseTable(table){
      let maxCol = 0;

      const tbody = table.querySelector('tbody')
      const lines = Array.from(tbody.querySelectorAll('tr'))
      .filter(i=>i.children.length > 0)
      .map(line=>{
        const cells = Array.from(line.querySelectorAll('td'))
        .map(cell=>cell.innerText.trim())

        maxCol = cells.length > maxCol ? cells.length : maxCol;

        return cells;
      })

      return {lines, maxCol}
    },
    parseHeaders(table){
      const thead = table.querySelector('thead')
      if(!thead){
        return;
      }
      const rows = thead.querySelectorAll('tr');

      if(rows.length == 0){
        return [];
      }


      return Array.from(rows).map(row=>{
        return Array.from(row.children).map(item=>{
          let t =item.innerText;
          return t.trim()
        })
      })
    }
  },
  viewService:{
    createElement(tagName, parent, args){
      let el = document.createElement(tagName)
      Object.keys(args).forEach(key=>{
        if(key === 'style'){
          Object.keys(args.style).forEach(styleArg=>el.style[styleArg] = args.style[styleArg])
          return
        }
        if(key === 'data'){
          Object.keys(args.data).forEach(dataArg=>el.setAttribute(`data-${dataArg}`, args.data[dataArg]))
        }
        el[key] = args[key]
      })

      parent.appendChild(el)
      if(el.elements){
        el.elements.forEach(ch => {
          this.createElement(ch.tagName, ch.args, el)
        })
      }
      return el;
    },
  },
  _addStyleSheet(){
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    .dodler-root{
      position:fixed;
      top:20px;
      left:20px;
      background-color: #81c90236;
      z-index: 9999;
      border: 1px solid #029bc973;
      overflow:hidden;
      box-shadow: rgba(11, 255, 52, 0.2) 0px 7px 29px 0px;
      width:auto;
      height:auto;
    }
    .dodler-root.active{
      resize:both;
      box-shadow: rgba(11, 255, 52, 0.52) 0px 7px 29px 0px;
    }
    .dodler-root *::-webkit-scrollbar {
      width: 1em;
      cursor:pointer;
    }

    .dodler-root *::-webkit-scrollbar-track {
      box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    }
    .dodler-root *::-webkit-scrollbar-corner {
      box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    }

    .dodler-root *::-webkit-scrollbar-thumb {
      background-color: darkgrey;
      outline: 1px solid slategrey;
    }
    .dodler-root ::placeholder{
      color:black;
    }
    .dodler-root #toggleBtn{
      background-color: #73943b7a;
    }
    .dodler-root #toggleBtn:before{
      content: url("data:image/svg+xml,%3Csvg fill='%23000000' width='15' height='15' viewBox='0 0 32 32' enable-background='new 0 0 32 32' id='Glyph' version='1.1' xml:space='preserve' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Cpath d='M27.526,18.036L27,17.732c-0.626-0.361-1-1.009-1-1.732s0.374-1.371,1-1.732l0.526-0.304 c1.436-0.83,1.927-2.662,1.098-4.098l-1-1.732c-0.827-1.433-2.666-1.925-4.098-1.098L23,7.339c-0.626,0.362-1.375,0.362-2,0 c-0.626-0.362-1-1.009-1-1.732V5c0-1.654-1.346-3-3-3h-2c-1.654,0-3,1.346-3,3v0.608c0,0.723-0.374,1.37-1,1.732 c-0.626,0.361-1.374,0.362-2,0L8.474,7.036C7.042,6.209,5.203,6.701,4.375,8.134l-1,1.732c-0.829,1.436-0.338,3.269,1.098,4.098 L5,14.268C5.626,14.629,6,15.277,6,16s-0.374,1.371-1,1.732l-0.526,0.304c-1.436,0.829-1.927,2.662-1.098,4.098l1,1.732 c0.828,1.433,2.667,1.925,4.098,1.098L9,24.661c0.626-0.363,1.374-0.361,2,0c0.626,0.362,1,1.009,1,1.732V27c0,1.654,1.346,3,3,3h2 c1.654,0,3-1.346,3-3v-0.608c0-0.723,0.374-1.37,1-1.732c0.625-0.361,1.374-0.362,2,0l0.526,0.304 c1.432,0.826,3.271,0.334,4.098-1.098l1-1.732C29.453,20.698,28.962,18.865,27.526,18.036z M16,21c-2.757,0-5-2.243-5-5s2.243-5,5-5 s5,2.243,5,5S18.757,21,16,21z' id='XMLID_273_'/%3E%3C/svg%3E");
    }
    .dodler-root.active #toggleBtn{
      background-color: #7b202d;
    }
    .dodler-root.active #toggleBtn:before{
      content: "❌"
    }
    .btnHolder{
      display:flex;
      justify-content:end;
    }
    .dodler-root #contentRoot{
      height:0;
      width:0;
      transition:width 0.6s, height 0.4s;
      padding:0 6px;
    }
    .dodler-root.active #contentRoot{
      width:540px;
      height:250px;
      display: flex;
      flex-direction:row;
    }
    .dodler-root #contentRoot #outputArea{
      height:60%;
      width: 300px;
    }
    .dodler-root .text-box{
      background-color:#81c902a3;
      margin:2px 1px;
      color:black;
    }
    .dodler-root #actionBtn{
      background-color: #8b8a8a;
    }
    .dodler-root #actionBtn:before{
      content:url("data:image/svg+xml,%3Csvg width='24px' height='24px' viewBox='0 0 1024 1024' class='icon' version='1.1' xmlns='http://www.w3.org/2000/svg' fill='%23000000'%3E%3Cg id='SVGRepo_bgCarrier' stroke-width='0'%3E%3C/g%3E%3Cg id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'%3E%3C/g%3E%3Cg id='SVGRepo_iconCarrier'%3E%3Cpath d='M587.410286 553.837714L709.266286 680.96a30.061714 30.061714 0 0 1-43.958857 40.96L541.110857 592.457143a180.443429 180.443429 0 1 1 46.299429-38.546286z m-136.923429 2.852572a120.246857 120.246857 0 1 0 0-240.566857 120.246857 120.246857 0 0 0 0 240.566857z m409.088 189.366857l-0.585143-0.365714a32.914286 32.914286 0 0 1-8.045714-46.445715 412.013714 412.013714 0 1 0-141.897143 145.846857c14.628571-8.996571 33.645714-5.12 43.666286 8.777143l0.146286 0.073143a30.427429 30.427429 0 0 1-7.972572 43.227429l-6.144 4.022857a475.428571 475.428571 0 1 1 163.693714-164.498286 29.988571 29.988571 0 0 1-42.861714 9.362286z' fill='%23000000'%3E%3C/path%3E%3C/g%3E%3C/svg%3E");
    }
    .dodler-root #actionBtn.on{
      background-color: #AACCDD;
    }
    .dodler-root #headerInputs{
      width: 230px;
    }
    .dodler-root #headerInputs input{
      width: 170px;
    }
    .dodler-root #headerInputs input[type='checkbox'] {
      width: 17px;
    }
    `;
    document.getElementsByTagName('head')[0].appendChild(style);
  }
}
dodler.init()
