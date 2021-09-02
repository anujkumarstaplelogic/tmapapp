import React, { Component } from 'react';
import { Modal,View, Text, Image,StyleSheet,TouchableOpacity,ScrollView,SafeAreaView,Alert, Dimensions, Platform} from 'react-native';
import { Picker, Container, Header, Content, Form, Item, Input, Label,Button, Toast, Icon,ListItem, CheckBox, Body } from 'native-base';
import { image, config, _showErrorMessage, _showSuccessMessage, Loader, _storeUser,_storeData,_retrieveData } from 'assets';
import CustomHeader from '../../CustomHeader';
//import {Picker} from '@react-native-community/picker';
import { getCompanies,getData,getWarehouseById,postData } from 'api';
import { StackActions } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import Geolocation from 'react-native-geolocation-service';
class Company extends Component {
  constructor(props) {
      super(props);
      this.state = {
        cid: 0,
        warehouse_id: 0, 
        cname: 'Select Company',
        companies:[],
        isloading:false,
        showCompany:false, 
        showWarehouse:false, 
        warehouses:[],
        gps_long:'',
        gps_lat:'',
        locationAttempt:0,
        showWarehouseAlert:false
      };
    } 


      componentDidMount = () => {

        const _this = this;
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
           this.getCurrentPosition();
            _retrieveData('HomeSecreen')
            .then((res) => {
              if(res){
                if(res == 'ScanParcel') {
                  this.setState({showCompany:false})
                    _this.props.navigation.navigate('ScanParcel');

                } else {
                  this.setState({showCompany:true})
                }
              } else {
                this.setState({showCompany:true})
              }
          });

            _retrieveData('user_avtar')
        .then((res) => {
          if(res != null){
            this.setState({user_avtar:res});
          }
        });
    });
      this.setState({isloading:true});    
      getCompanies().then((res) => {
        this.setState({isloading:false}); 
            this.setState({companies:res.data});
        }); 
  };


    componentWillUnmount() {
      this._unsubscribe();
    }

       lapsList = () => {
     return this.state.warehouses.map((data) => {
      return (
        <Picker.Item key={data.id} label = {data.Warehouse_name} value = {data.id} />
      )
    })
}

backPage () {
  this.setState({showWarehouse:false });
}

getCurrentPosition() {
Geolocation.getCurrentPosition(
        (position) => {
          console.log(position);
          this.setState({
          gps_long: position.coords.longitude,
          gps_lat: position.coords.latitude
        });
        },
        (error) => {
          // See error code charts below.
          _showErrorMessage(error.message)
          // console.log(error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 7000 }
    );
}

  // updateWarehouses = async (wid): Promise<void> => {
  //async updateWarehouses = (wid) => {
    async updateWarehouses(wid) {

      if(wid > 0) {
        this.setState({isloading:true });

    let currentLongitude = this.state.gps_long;
    let currentLatitude = this.state.gps_lat;
    let error_location = '';

     
      console.log("COmme");
       const locdata = await Geolocation.getCurrentPosition(
        (position) => {
          currentLongitude: position.coords.longitude;
          currentLatitude: position.coords.latitude;
        },
        (error) => {
          // See error code charts below.
          _showErrorMessage(error.message)
          // console.log(error.code, error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
       console.log("oouut");

  if(currentLongitude == '' || currentLongitude == null) {
        this.setState({isloading:false });
          this.getCurrentPosition();
          _showErrorMessage('Location not Found please try again.');
          return false;  
        
      }



        var postdata1 = { warehouse_id:wid,gps_lat:currentLatitude,gps_long:currentLongitude};
        //var postdata1 = { warehouse_id:wid,gps_lat:'',gps_long:''};
     postData(postdata1,'scan_warehouse_location').then((res) => {
      console.log(res);
      if(res.type == 1) {
          _showSuccessMessage(res.message);
          const _this = this;
          _storeData('warehouse_id',wid).then();
        this.setState({ warehouse_id: wid,isloading:false });
        _storeData('is_rescue','no').then();
        _storeData('LoadSecreen','LoadMain').then();
        _storeData('secreenTab','Dashboard').then();
          setTimeout(function(){
            _this.setState({isloading:false});
              _this.props.navigation.dispatch(
            StackActions.replace('Dashboard')
        );
            }, 1000);

      } else {
        this.setState({isloading:false });
        _showErrorMessage(res.message);
      }
    });

        
      }
  }

    selectCompany = (cid,is_alert_allow,company_name) => {
      const _this = this;
      if(is_alert_allow == 'yes') {
            Alert.alert(
                "ALERT:",
                "YOU ARE NOT AUTHORIZED.",
                [
                  { 
                    text: "Ok",
                    style: "cancel"
                  }
                ],
                { cancelable: false }
              );
      } else {
        _this.setState({ cid: cid }, () => {
        setTimeout(() => {
          Alert.alert(
                "Continue",
                "Are you sure with this company",
                [
                  {
                    text: "Cancel",
                    onPress: () => _this.setState({ cid: 0}),
                    style: "cancel"
                  },
                  { text: "Yes", onPress: () => {
                        _this.setState({ cid: cid, isloading:true,showWarehouse:true });
                        
                          _storeData('companyId',cid).then();
                          _storeData('companyName',company_name).then();
                                                
                          getWarehouseById(this.state.cid).then((res) => {

                            console.log(res.data.Warehouses);
                          this.setState({warehouses:res.data.Warehouses,isloading:false});
                      });

                      } 
                  }  
                ],
                { cancelable: false }
              );
        }, 500)
      });
      }
    }

  refreshPage() {
    this.props.navigation.push('Company');
  }

  selectWorkType(type) {
    const _this = this;
      if(type == 'rescue') {
        _storeData('is_rescue','yes').then();
        _storeData('LoadSecreen','Rescue').then();
      } else {
        _storeData('is_rescue','no').then();
        _storeData('LoadSecreen','LoadMain').then();
      }
       _storeData('is_rescue','no').then();
        _storeData('LoadSecreen','LoadMain').then();
   _storeData('secreenTab','Dashboard').then();
      setTimeout(function(){
        _this.setState({isloading:false,showWarehouseAlert:false });
          _this.props.navigation.dispatch(
        StackActions.replace('Dashboard')
    );
        }, 1000);
  }

    render() {
      return (
            <Container>
              <CustomHeader {...this.props} url={this.state.user_avtar} />
              <Content>
              <Modal animationType="slide" transparent={true} visible={this.state.showWarehouseAlert}>
        <View style={styles1.centeredView}>
          <View style={styles1.modalView}>
            <View style={{alignSelf:'center',padding:10}}>
            <Text style={{fontSize:18, fontWeight:'bold'}}>WORK OF TYPE</Text>
            </View>
            <View style={{ flexDirection: 'row',alignSelf:'center', padding:10}}>
              <Text style={{fontSize:15, fontWeight:'bold',color: 'red'}}>Today which Type of Work you will do, Click on suitable type</Text>
            </View>  
            <View style={{padding:15,alignSelf:'center',justifyContent:'center',alignItems:'center'}}>
              <Button 
                style={{ height: 30,width:200, backgroundColor: '#00c2f3', borderRadius: 5,justifyContent:'center',alignItems:'center',textAlign: 'center'}}
                onPress={() => this.selectWorkType('load')}>
                <Text style={{ textAlign: 'center', color: '#fff', fontSize: 16 }}>NEW LOAD</Text>
              </Button>
              <Button 
                style={{ height: 30,width:200, backgroundColor: '#00c2f3', borderRadius: 5,justifyContent:'center',alignItems:'center',textAlign: 'center',marginTop:20}}
                onPress={() => this.selectWorkType('rescue')}>
                <Text style={{ textAlign: 'center', color: '#fff', fontSize: 16 }}>RESCUE</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
              {!this.state.showWarehouse?
             (<View style={{flex:1, top:6}}>
              <View style={{flex:1, backgroundColor:'#00c2f3', height:'28%',flexDirection: 'row',justifyContent: 'space-between',alignItems:'center'}}>
                <Text style={{padding:10, fontSize:20,color:'white',textAlign:'center'}}>CHOOSE YOUR COMPANY</Text>
                <TouchableOpacity onPress={() => this.refreshPage()}>
            <Icon style={{color:'#fff',right:8,fontWeight:200}} name='sync' />
          </TouchableOpacity>
                </View>
              {this.state.companies.map((res, i) => {
                var mm = 0;
                if(i == 3) {
                  mm = 17;
                }
            return (
                <ListItem style={{height:45,paddingLeft:10,paddingRight:10}} noBorder>
                      <CheckBox style={{paddingLeft:0}} onPress={() => this.selectCompany(res.id,res.is_alert_allow,res.company_name) } checked={this.state.cid == res.id?true:false} />
                      <Body>
                        <Image
                    style={{ marginTop:mm,height: 35, width: 180, resizeMode: 'contain' }}
                    source={{uri:res.company_logo}}/>
                      </Body>
                    </ListItem>
                  );
                  })
                 }
              </View>) :  <View>

             <View style={{flex:1, backgroundColor:'#00c2f3', height:'28%',flexDirection: 'row',justifyContent: 'space-between',alignItems:'center'}}>
            <TouchableOpacity style={{flexDirection: 'row',
    alignItems:'center'}} onPress={() => this.backPage()}>
              <Icon type="FontAwesome" name='angle-left' style={{color: '#fff',
    fontWeight: '100',
    padding:10}}/>
              <Text style={{color:"#fff",fontWeight:'bold',marginTop:(Platform.OS == 'ios') ? 5 : 0, fontSize: 22,padding:10,textAlign:'center',paddingLeft:'4%'}}>WAREHOUSES</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.refreshPage()}>
            <Icon style={{color:'#fff',right:8,fontWeight:200}} name='sync' />
          </TouchableOpacity>
        </View>

        <View style={{flex:1, backgroundColor:'#00c2f3', height:'60%',borderRadius: 10, marginTop:15}}>
                <Text style={{padding:15, fontSize:22,color:'#fff'}}>Choose Your Warehouse</Text>
                <View style={{width:Dimensions.get("window").width*0.85, marginLeft: 15}}>
                <Item regular style={{ backgroundColor:'#fff', height:40 }} >
                
                <Picker 
                  style={{ fontWeight:200, fontSize:50, borderRadius:10, borderWidth: 5}}
                  mode="dropdown"
                  iosIcon={<Icon type="FontAwesome" name="angle-down" style={{ right:30, color: "#000"}} />}
                  style={{ width: (Platform.OS == 'ios') ? Dimensions.get("window").width*0.85 :Dimensions.get("window").width*0.75 }}
                  placeholder={'Select Warehouse'}
                  selectedValue = {this.state.warehouse_id}
                  placeholderStyle={{color: '#000'}}
                  onValueChange={(itemValue) =>  
                        this.updateWarehouses(itemValue)}>
                        <Picker.Item  label = {'Select Warehouse'} value = {'0'} />
                  {this.lapsList()}
                </Picker>
                </Item>
                </View>
              </View>
              </View>
          }
              
            </Content>
             {this.state.isloading && (
              <Loader />
          )}
        </Container>
      )
  }
}

export default Company;


const styles1 = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    padding: 10,
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    shadowColor: "#000",
    borderColor: '#00c2f3',
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  }
});