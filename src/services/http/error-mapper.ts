export const mapApiError = (statusCode?: number, messageKey?: string): string => {
  if (statusCode === 401) {
    return '登入已失效，請重新登入';
  }
  if (statusCode === 404) {
    return '找不到資料';
  }
  if (statusCode === 422) {
    return '輸入資料有誤，請檢查後重試';
  }
  if (statusCode && statusCode >= 500) {
    return '伺服器忙碌中，請稍後再試';
  }
  if (messageKey === 'invalidCredentials') {
    return '帳號或密碼錯誤';
  }
  if (messageKey) {
    return `系統訊息：${messageKey}`;
  }
  return '發生未知錯誤，請稍後再試';
};

