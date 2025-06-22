# 芒夏Healthcare Platform API 文档

## 基础信息
- **Base URL**: `http://localhost:3001`
- **内容类型**: `application/json`
- **响应格式**: 统一JSON格式

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {...}
}
```

### 失败响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 患者相关接口

### 1. 获取所有患者列表
**用途**: Admin页面患者列表
```
GET /api/patients/
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "patient_id": "uuid",
      "patient_name": "张三",
      "phone_number": "13800138000",
      "gender": "male",
      "operation_type": "生物瓣膜",
      "operation_date": "2024-01-01",
      "discharge_date": "2024-01-15",
      "latest_inr": 1.8,
      "latest_inr_date": "2024-02-01",
      "suggested_dose": 2.5,
      "latest_plan_status": "pending",
      "latest_plan_id": "uuid",
      "current_dose": 2.0
    }
  ]
}
```

### 2. 获取患者详情
**用途**: Admin页面患者详情页
```
GET /api/patients/:patientId
```

**参数**:
- `patientId`: 患者ID (UUID)

**响应**:
```json
{
  "success": true,
  "data": {
    "patient_id": "uuid",
    "patient_name": "张三",
    "phone_number": "13800138000",
    "gender": "male",
    "date_of_birth": "1980-01-01",
    "surgery_type": "生物瓣膜",
    "operation_date": "2024-01-01",
    "discharge_date": "2024-01-15",
    "doctor_name": "李医生",
    "doctor_hospital": "某某医院",
    "medication_plans": [
      {
        "plan_id": "uuid",
        "system_suggested_dosage": 2.5,
        "doctor_suggested_dosage": 2.0,
        "previous_dosage": 1.5,
        "remarks": "备注信息",
        "status": "pending",
        "created_at": "2024-02-01 10:30:00",
        "inr_value": 1.8,
        "measurement_date": "2024-02-01"
      }
    ],
    "health_metrics": [
      {
        "id": "uuid",
        "metric_type": "INR",
        "metric_value": 1.8,
        "unit": null,
        "measured_at": "2024-02-01 10:30:00"
      }
    ]
  }
}
```

### 3. 获取患者当前状态
**用途**: 小程序首页
```
GET /api/patients/:patientId/current-status
```

**参数**:
- `patientId`: 患者ID (UUID)

**响应**:
```json
{
  "success": true,
  "data": {
    "patient_id": "uuid",
    "patient_name": "张三",
    "phone": "13800138000",
    "current_dosage": 2.0,
    "metric": {
      "value": 1.8,
      "measured_at": "2024-02-01"
    },
    "status": "active",
    "updated_at": "2024-02-01 10:30:00"
  }
}
```

### 4. 获取患者基本信息
**用途**: 小程序"我的"页面
```
GET /api/patients/:patientId/profile
```

**参数**:
- `patientId`: 患者ID (UUID)

**响应**:
```json
{
  "success": true,
  "data": {
    "patient_id": "uuid",
    "patient_name": "张三",
    "gender": "male",
    "phone": "13800138000",
    "operation_type": "生物瓣膜",
    "operation_date": "2024-01-01",
    "discharge_date": "2024-01-15"
  }
}
```

### 5. 获取最新用药计划
**用途**: 小程序历史记录页面
```
GET /api/patients/:patientId/latest-active-plans
```

**参数**:
- `patientId`: 患者ID (UUID)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "plan_id": "uuid",
      "system_suggested_dosage": 2.5,
      "doctor_suggested_dosage": 2.0,
      "status": "active",
      "plan_created_at": "2024-02-01 10:30:00",
      "plan_updated_at": "2024-02-01 11:00:00",
      "metric_value": 1.8,
      "metric_measured_at": "2024-02-01 09:00:00",
      "metric_created_at": "2024-02-01 09:30:00"
    }
  ]
}
```

### 6. 注册新患者
**用途**: Admin页面新增患者
```
POST /api/patients/register
```

**请求体**:
```json
{
  "name": "张三",
  "gender": "male",
  "phone": "13800138000",
  "operation_type": "生物瓣膜",
  "operation_date": "2024-01-01",
  "discharge_date": "2024-01-15",
  "metric_value": 1.8,
  "doctor_suggested_dosage": 2.0,
  "remarks": "备注信息"
}
```

**必填字段**:
- `name`: 患者姓名
- `phone`: 手机号

**响应**:
```json
{
  "success": true,
  "data": {
    "patientId": "uuid"
  }
}
```

### 7. 添加健康指标
**用途**: 新增INR检测记录
```
POST /api/patients/:patientId/metrics
```

**参数**:
- `patientId`: 患者ID (UUID)

**请求体**:
```json
{
  "metric_type": "INR",
  "metric_value": 1.8
}
```

**响应**:
```json
{
  "success": true,
  "message": "健康指标添加成功"
}
```

### 8. 更新用药计划
**用途**: Admin页面确认/拒绝用药建议
```
PUT /api/patients/medication-plan/:planId
```

**参数**:
- `planId`: 用药计划ID (UUID)

**请求体**:
```json
{
  "status": "active",
  "doctor_suggested_dosage": 2.0,
  "remarks": "备注信息"
}
```

**状态值**:
- `active`: 确认/激活
- `rejected`: 拒绝

**响应**:
```json
{
  "success": true,
  "data": {
    "plan_id": "uuid",
    "status": "active",
    "doctor_suggested_dosage": 2.0,
    "updated_at": "2024-02-01T11:00:00.000Z"
  }
}
```

---

## 状态码说明

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 字段类型说明

### 性别 (gender)
- `male`: 男
- `female`: 女

### 用药计划状态 (status)
- `pending`: 待确认
- `active`: 已确认/激活
- `rejected`: 已拒绝

### 时间格式
- 日期: `YYYY-MM-DD` (如: 2024-02-01)
- 日期时间: `YYYY-MM-DD HH24:MI:SS` (如: 2024-02-01 10:30:00)

---

## 错误处理

所有接口在出错时都会返回统一的错误格式:

```json
{
  "success": false,
  "error": "具体错误信息"
}
```

常见错误:
- "患者不存在"
- "姓名和手机号必填"
- "用药计划不存在"
- "获取患者列表失败"
- "服务器内部错误" 