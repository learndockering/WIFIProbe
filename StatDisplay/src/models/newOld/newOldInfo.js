/**
 * Created by yyy on 2017/5/27.
 */
import pathToRegexp from 'path-to-regexp';
import {getProbeAll, getProbeDetail} from '../../services/probeService';
import {getNewOld, getNewOldDetail} from '../../services/newOldService';
import {Modal} from 'antd';


export default {
  namespace: 'newOldInfo',

  state: {
    probeOptions:[],
    hourData:[],
    detailData:[]
  },

  subscriptions: {
    setup ({ dispatch, history }) {
      history.listen(location => {
        const matchFlow = pathToRegexp('/newAndOld').exec(location.pathname);
        if(matchFlow) {
          const currentDate = new Date();
          const currentHour = parseInt(currentDate.valueOf()/(1000*60*60));//距离现在最近的整点对应的小时数
          const beforeHour = currentHour-5*24;//获取距离最近整点前5天的数据
          console.log("currentHour :"+currentHour);
          dispatch({
            type: 'getProbeOptions',
            payload: {page:0, size: 10}
          });
          dispatch({
            type: 'getHourData',
            payload: {probeId: '1s12sz', startHour:beforeHour, startRange:5, threshold:"DAY"}
          });
          dispatch({
            type: 'getDetail',
            payload: {hour:currentHour-1,probeId:"1s12sz"}
          });
        }
      })
    }
  },

  effects: {
    *getHourData ({payload}, {call,put}) {
      const data = yield call(getNewOld, payload);
      if(data.code==1000){
        const hourVo = data.data;

        const len = hourVo.length;
        let realData = hourVo.slice(0,len-3);
        let commonItem = hourVo[len-3];
        commonItem["newCustomerPre"] = commonItem.newCustomer;
        commonItem["oldCustomerPre"] = commonItem.oldCustomer;
        realData.push(commonItem);

        const predictHourData = hourVo.slice(len-2);
        predictHourData.forEach(function(item) {
            console.log("item is :" + JSON.stringify(item));
            let predictItem = {
              id: item.id,
              wifiProb: item.wifiProb,
              hour: item.hour,
              newCustomerPre: item.newCustomer,
              oldCustomerPre: item.oldCustomer,
            };
            console.log("predict item is: "+ JSON.stringify(predictItem));
            realData.push(predictItem);
          }
        );


        console.log("final data is :"+JSON.stringify(realData));

        yield put({
          type: 'setHourData',
          payload:realData
        });
      }else{
        console.log("data is "+JSON.stringify(data));
        Modal.error({
          title: 'get data occurs error',
          content: data.msg,
        });

      }
    },

    *getDetail({payload}, {call,put}) {
      const data = yield call(getNewOldDetail, payload);
      if(data.code==1000){
        const dataVo = data.data;
        yield put({
          type: 'setDetailData',
          payload:dataVo
        })
      }else{
        console.log("data is "+JSON.stringify(data));
        Modal.error({
          title: 'get data occurs error',
          content: data.msg,
        });

      }
    },

    *getProbeOptions({payload},{call,put}) {
      const data = yield call(getProbeAll, payload);
      if(data){
        if(data.code == 1000){
          let probeList = [];
          const initProbeList = data.data.content;
          for(let key in initProbeList){
            probeList.push({value: initProbeList[key].probeId, label: initProbeList[key].probeId});
          }
          yield put({
            type: 'setProbeOptions',
            payload: probeList
          })


        }

      }
    }




  },

  reducers: {

    setHourData(state, action) {
      return {
        ...state,
        hourData:action.payload
      }
    },

    setDetailData(state, action) {
      return {
        ...state,
        detailData:action.payload
      }
    },

    setProbeOptions(state, action) {
      return {
        ...state,
        probeOptions:action.payload
      }
    }
  }


}

