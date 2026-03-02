import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  PhoneOutlined
} from '@ant-design/icons-vue';

export type RestaurantInfoField =
  | 'address'
  | 'status'
  | 'timeslots'
  | 'note'
  | 'priceRange'
  | 'contact';

export interface RestaurantInfoLabel {
  zhTW: string;
  enUS: string;
}

export interface RestaurantInfoIconConfig {
  icon: unknown;
  label: RestaurantInfoLabel;
}

const buildLabel = (zhTW: string, enUS: string): RestaurantInfoLabel => ({ zhTW, enUS });

export const restaurantInfoIconMap: Record<RestaurantInfoField, RestaurantInfoIconConfig> = {
  address: {
    icon: EnvironmentOutlined,
    label: buildLabel('地址', 'Address')
  },
  status: {
    icon: CheckCircleOutlined,
    label: buildLabel('狀態', 'Status')
  },
  timeslots: {
    icon: ClockCircleOutlined,
    label: buildLabel('時段', 'Timeslots')
  },
  note: {
    icon: FileTextOutlined,
    label: buildLabel('備註', 'Notes')
  },
  priceRange: {
    icon: DollarOutlined,
    label: buildLabel('價位', 'Price Range')
  },
  contact: {
    icon: PhoneOutlined,
    label: buildLabel('聯絡', 'Contact')
  }
};

export const defaultRestaurantInfoIcon: RestaurantInfoIconConfig = {
  icon: InfoCircleOutlined,
  label: buildLabel('資訊', 'Info')
};

export const getRestaurantInfoIcon = (field: RestaurantInfoField): RestaurantInfoIconConfig =>
  restaurantInfoIconMap[field] ?? defaultRestaurantInfoIcon;
