import './App.css'
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useState } from 'react'

// 模拟患者数据
const mockPatients = [
  {
    id: '000004',
    name: '刘六',
    phone: '18812345555',
    gender: '男',
    age: 58,
    surgeryType: '生物瓣膜',
    surgeryDate: '2024/02/28',
    dischargeDate: '2024/03/15',
    latestINR: 3.0,
    testDate: '2025/04/10',
    currentDose: '2片',
    suggestedDose: '异常',
    status: '待认',
    initialDose: '2片',
    history: '无',
    records: [
      { id: '9000004', dose: '2片', inr: 3.0, testDate: '2025/04/10', sysDose: '2片', confirmStatus: '待确认', doctorDose: '', note: '', op: '' },
    ],
  },
  {
    id: '000003',
    name: '王五',
    phone: '18812343333',
    gender: '女',
    age: 70,
    surgeryType: '生物瓣膜',
    surgeryDate: '2024/12/06',
    dischargeDate: '2024/12/15',
    latestINR: 1.3,
    testDate: '2025/06/10',
    currentDose: '2片',
    suggestedDose: '2.25片',
    status: '待认',
    initialDose: '2片',
    history: '无',
    records: [
      { id: '9000003', dose: '2片', inr: 1.3, testDate: '2025/06/10', sysDose: '2.25片', confirmStatus: '待确认', doctorDose: '', note: '', op: '' },
    ],
  },
  {
    id: '000002',
    name: '李四',
    phone: '18812346666',
    gender: '女',
    age: 65,
    surgeryType: '机械瓣膜',
    surgeryDate: '2025/05/06',
    dischargeDate: '2025/05/15',
    latestINR: 1.9,
    testDate: '2025/05/31',
    currentDose: '2片',
    suggestedDose: '1.75片',
    status: '待认',
    initialDose: '2片',
    history: '无',
    records: [
      { id: '9000002', dose: '2片', inr: 1.9, testDate: '2025/05/31', sysDose: '1.75片', confirmStatus: '待确认', doctorDose: '', note: '', op: '' },
    ],
  },
  {
    id: '000001',
    name: '张三',
    phone: '18812345678',
    gender: '男',
    age: 60,
    surgeryType: '生物瓣膜',
    surgeryDate: '2025/01/05',
    dischargeDate: '2025/01/25',
    latestINR: 1.5,
    testDate: '2025/04/01',
    currentDose: '2片',
    suggestedDose: '2片',
    status: '待认',
    initialDose: '2片',
    history: '患者都有主动脉夹层，围绕生物瓣膜，需终身服用华法林',
    records: [
      { id: '9000005', dose: '2片', inr: 1.7, testDate: '2025/04/10', sysDose: '2片', confirmStatus: '已确认', doctorDose: '2片', note: '', op: '' },
      { id: '9000004', dose: '2片', inr: 1.8, testDate: '2025/04/05', sysDose: '2片', confirmStatus: '已确认', doctorDose: '2片', note: '', op: '' },
      { id: '9000003', dose: '2片', inr: 1.0, testDate: '2025/03/25', sysDose: '2片', confirmStatus: '待确认', doctorDose: '', note: '', op: '' },
      { id: '9000002', dose: '2片', inr: 2.0, testDate: '2025/02/25', sysDose: '1.75片', confirmStatus: '已确认', doctorDose: '1.75', note: '', op: '' },
      { id: '9000001', dose: '2片', inr: 1.5, testDate: '2025/01/25', sysDose: '', confirmStatus: '', doctorDose: '2片', note: '患者出院', op: '' },
    ],
  },
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <aside className="sidebar">
      <div className="sidebar-title">芒夏Admin</div>
      <nav>
        <div
          className={`sidebar-item${(location.pathname === '/' || location.pathname.startsWith('/patient')) ? ' active' : ''}`}
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          患者列表
        </div>
        <div
          className={`sidebar-item${location.pathname === '/add' ? ' active' : ''}`}
          onClick={() => navigate('/add')}
          style={{ cursor: 'pointer' }}
        >
          新增患者
        </div>
      </nav>
    </aside>
  )
}

function PatientListPage({ patients, onConfirm }: { patients: any[], onConfirm: (id: string) => void }) {
  const navigate = useNavigate()
  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <div className="filter-bar">
          <label>用户ID <input type="text" disabled placeholder="（筛选功能暂未实现）" /></label>
          <label>姓名 <input type="text" disabled placeholder="（筛选功能暂未实现）" /></label>
          <button className="search-btn" disabled>搜索</button>
        </div>
        <table className="patient-table">
          <thead>
            <tr>
              <th>用户ID</th>
              <th>姓名</th>
              <th>手机号</th>
              <th>性别</th>
              <th>年龄</th>
              <th>手术类型</th>
              <th>手术时间</th>
              <th>出院时间</th>
              <th>最新INR</th>
              <th>检验时间</th>
              <th>当前剂量</th>
              <th>建议剂量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.phone}</td>
                <td>{p.gender}</td>
                <td>{p.age}</td>
                <td>{p.surgeryType}</td>
                <td>{p.surgeryDate}</td>
                <td>{p.dischargeDate}</td>
                <td>{p.latestINR}</td>
                <td>{p.testDate}</td>
                <td>{p.currentDose}</td>
                <td>{p.suggestedDose}</td>
                <td>
                  <a href="#" style={{ color: '#1677ff', marginRight: 8 }} onClick={e => { e.preventDefault(); navigate(`/patient/${p.id}`) }}>查看</a>
                  {p.status === '待认' ? (
                    <a
                      href="#"
                      style={{ color: 'red' }}
                      onClick={e => { e.preventDefault(); onConfirm(p.id); }}
                    >
                      确认
                    </a>
                  ) : (
                    <span style={{ color: 'gray' }}>已确认</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  )
}

function PatientDetailPage() {
  const { id } = useParams()
  const [patients, setPatients] = useState(mockPatients)
  const patient = patients.find(p => p.id === id)
  const [editRow, setEditRow] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ doctorDose: string; note: string }>({ doctorDose: '', note: '' })

  if (!patient) {
    return <div>未找到该患者</div>
  }

  // 编辑保存
  const handleSave = (rowId: string) => {
    setPatients(prev => prev.map(p =>
      p.id === patient.id ? {
        ...p,
        records: p.records.map((r: any) =>
          r.id === rowId ? { ...r, doctorDose: editValues.doctorDose, note: editValues.note } : r
        )
      } : p
    ))
    setEditRow(null)
  }

  // 确认
  const handleConfirm = (rowId: string) => {
    if (!window.confirm('确认要将此条用药记录设为已确认吗？')) return
    setPatients(prev => prev.map(p =>
      p.id === patient.id ? {
        ...p,
        records: p.records.map((r: any) =>
          r.id === rowId ? { ...r, confirmStatus: '已确认' } : r
        )
      } : p
    ))
    setEditRow(null)
  }

  // 拒绝
  const handleReject = (rowId: string) => {
    if (!window.confirm('确认要将此条用药记录设为已拒绝吗？')) return
    setPatients(prev => prev.map(p =>
      p.id === patient.id ? {
        ...p,
        records: p.records.map((r: any) =>
          r.id === rowId ? { ...r, confirmStatus: '已拒绝' } : r
        )
      } : p
    ))
    setEditRow(null)
  }

  // 进入编辑
  const handleEdit = (row: any) => {
    setEditRow(row.id)
    setEditValues({ doctorDose: row.doctorDose || '', note: row.note || '' })
  }

  // 取消编辑
  const handleCancel = () => {
    setEditRow(null)
  }

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        {/* 患者信息 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>患者信息</div>
          <table className="patient-table" style={{ width: 'auto', minWidth: 400 }}>
            <thead>
              <tr>
                <th>用户ID</th>
                <th>姓名</th>
                <th>手机号</th>
                <th>性别</th>
                <th>年龄</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{patient.id}</td>
                <td>{patient.name}</td>
                <td>{patient.phone}</td>
                <td>{patient.gender}</td>
                <td>{patient.age}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* 病史信息 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>病史信息</div>
          <table className="patient-table" style={{ width: 'auto', minWidth: 400 }}>
            <thead>
              <tr>
                <th>手术类型</th>
                <th>手术时间</th>
                <th>出院时间</th>
                <th>初始华法林用量</th>
                <th>病史信息</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{patient.surgeryType}</td>
                <td>{patient.surgeryDate}</td>
                <td>{patient.dischargeDate}</td>
                <td>{patient.initialDose}</td>
                <td>{patient.history}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* 用药记录 */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>用药记录</div>
          <table className="patient-table">
            <thead>
              <tr>
                <th>单号</th>
                <th>华法林当前用量</th>
                <th>INR</th>
                <th>化验时间</th>
                <th>系统建议用量</th>
                <th>确认状态</th>
                <th>医生确认用量</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {patient.records.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.dose}</td>
                  <td>{r.inr}</td>
                  <td>{r.testDate}</td>
                  <td>{r.sysDose}</td>
                  <td>{r.confirmStatus}</td>
                  <td>
                    {editRow === r.id ? (
                      <input value={editValues.doctorDose} onChange={e => setEditValues(v => ({ ...v, doctorDose: e.target.value }))} style={{ width: 60 }} />
                    ) : (
                      r.doctorDose
                    )}
                  </td>
                  <td>
                    {editRow === r.id ? (
                      <input value={editValues.note} onChange={e => setEditValues(v => ({ ...v, note: e.target.value }))} style={{ width: 100 }} />
                    ) : (
                      r.note
                    )}
                  </td>
                  <td>
                    {r.confirmStatus === '待确认' && editRow !== r.id && (
                      <>
                        <a href="#" style={{ color: '#1677ff', marginRight: 8 }} onClick={e => { e.preventDefault(); handleEdit(r) }}>修改</a>
                        <a href="#" style={{ color: 'red', marginRight: 8 }} onClick={e => { e.preventDefault(); handleConfirm(r.id) }}>确认</a>
                        <a href="#" style={{ color: 'gray' }} onClick={e => { e.preventDefault(); handleReject(r.id) }}>拒绝</a>
                      </>
                    )}
                    {editRow === r.id && (
                      <>
                        <a href="#" style={{ color: '#1677ff', marginRight: 8 }} onClick={e => { e.preventDefault(); handleSave(r.id) }}>保存</a>
                        <a href="#" style={{ color: 'gray' }} onClick={e => { e.preventDefault(); handleCancel() }}>取消</a>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

function AddPatientPage({ onAdd }: { onAdd: (patient: any) => void }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    gender: '',
    phone: '',
    surgeryType: '',
    surgeryDate: '',
    dischargeDate: '',
    inr: '',
    inrDate: '',
    dose: '',
    note: '',
  })
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 校验
    if (!form.name || !form.gender || !form.phone || !form.surgeryType || !form.surgeryDate || !form.dischargeDate || !form.inr || !form.inrDate || !form.dose) {
      setError('请填写所有必填项')
      return
    }
    if (!/^\d{11}$/.test(form.phone)) {
      setError('手机号需为11位数字')
      return
    }
    setError('')
    if (!window.confirm('确认要登记该患者吗？')) return
    // 生成新患者ID
    const newId = String(Date.now()).slice(-6)
    onAdd({
      id: newId,
      name: form.name,
      phone: form.phone,
      gender: form.gender,
      age: '',
      surgeryType: form.surgeryType,
      surgeryDate: form.surgeryDate,
      dischargeDate: form.dischargeDate,
      latestINR: form.inr,
      testDate: form.inrDate,
      currentDose: form.dose,
      suggestedDose: form.dose,
      status: '待认',
      initialDose: form.dose,
      history: form.note,
      records: [
        {
          id: String(Date.now()),
          dose: form.dose,
          inr: form.inr,
          testDate: form.inrDate,
          sysDose: form.dose,
          confirmStatus: '待确认',
          doctorDose: '',
          note: form.note,
          op: '',
        },
      ],
    })
    navigate('/')
  }

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <form onSubmit={handleSubmit} className="add-patient-form">
          <div className="form-title">新增患者</div>
          <div className="form-fields">
            <label>姓名<span className="required">*</span> <input name="name" value={form.name} onChange={handleChange} /></label>
            <label>性别<span className="required">*</span> <input name="gender" value={form.gender} onChange={handleChange} /></label>
            <label>手机号<span className="required">*</span> <input name="phone" value={form.phone} onChange={handleChange} maxLength={11} /></label>
            <label>手术类型<span className="required">*</span> <input name="surgeryType" value={form.surgeryType} onChange={handleChange} /></label>
            <label>手术时间<span className="required">*</span> <input name="surgeryDate" value={form.surgeryDate} onChange={handleChange} type="date" /></label>
            <label>出院时间<span className="required">*</span> <input name="dischargeDate" value={form.dischargeDate} onChange={handleChange} type="date" /></label>
            <label>INR<span className="required">*</span> <input name="inr" value={form.inr} onChange={handleChange} /></label>
            <label>INR检查时间<span className="required">*</span> <input name="inrDate" value={form.inrDate} onChange={handleChange} type="date" /></label>
            <label>华法林剂量<span className="required">*</span> <input name="dose" value={form.dose} onChange={handleChange} /></label>
            <label>备注 <textarea name="note" value={form.note} onChange={handleChange} style={{ resize: 'none', height: 60 }} /></label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="form-submit-btn">注册新患者</button>
        </form>
      </main>
    </div>
  )
}

function App() {
  const [patients, setPatients] = useState(
    [...mockPatients].sort((a, b) => b.testDate.localeCompare(a.testDate))
  )
  const handleConfirm = (id: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: '已确认' } : p
      )
    )
  }
  const handleAdd = (patient: any) => {
    setPatients(prev => [patient, ...prev])
  }
  return (
    <Routes>
      <Route path="/" element={<PatientListPage patients={patients} onConfirm={handleConfirm} />} />
      <Route path="/patient/:id" element={<PatientDetailPage />} />
      <Route path="/add" element={<AddPatientPage onAdd={handleAdd} />} />
    </Routes>
  )
}

export default App
