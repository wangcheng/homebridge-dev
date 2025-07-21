interface BaseProperty {
  name: string;
  readOnly: boolean;
  statusIndex: number;
  type: "bool" | "num";
}

interface GetOnlyProperty extends BaseProperty {
  readOnly: true;
}

interface GetSetProperty extends BaseProperty {
  commandId: number;
  readOnly: false;
}

type PropMap = Record<string, boolean | number>;

export const parseStatus = (
  resultList: number[],
  properties: BaseProperty[]
): PropMap => {
  const map: PropMap = {};
  properties.forEach(({ name, statusIndex }) => {
    const value = resultList[statusIndex];
    if (typeof value === "number") {
      map[name] = value;
    }
  });
  return map;
};

export const DesiredTemperature: GetSetProperty = {
  commandId: 6,
  name: "desired_temperature",
  readOnly: false,
  statusIndex: 9,
  type: "num",
};

export const IndoorTemperature: GetOnlyProperty = {
  name: "indoor_temperature",
  readOnly: true,
  statusIndex: 10,
  type: "num",
};
