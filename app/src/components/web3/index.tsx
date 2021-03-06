import { useEffect, useState, useMemo } from "react";
import { useQueryParams, IAsyncResult, ShowError } from '../utils';

import { Spinner } from "react-bootstrap";
import { ChainInfo, Injectedweb3, ConnectCtx } from './injected';
import constate from 'constate';
import Web3 from "web3";

//using generic project ID if we don't use our own
const _infuraKey = process.env.REACT_APP_INFURA_KEY||'9aa3d95b3bc440fa88ea12eaa4456161';

console.log(`_infuraKey = ${_infuraKey}`);

type ContractDetails ={
    chain:ChainInfo;
    address:string;
    testFaucet?:string;
}

type ContractInfo ={
    assetSide:ContractDetails;
    cashSide:ContractDetails;
};

const _chains:{[network:string]:ContractInfo} ={
    'testnet':{
        assetSide:{
            chain:{ chainId: '4', name: 'Rinkeby', hexChainId: '0x4', rpcProvider: `https://rinkeby.infura.io/v3/${_infuraKey}` },
            address: '0x64Df5BE14e5a18c923b12A77992FfE7647549713',
            testFaucet: '0x361cf804bF937638d9C9d24F22B1E7BFC3650Bf7'
        },
        cashSide:{
            chain:{ chainId: '421611', name: 'Arbitrum Testnet', hexChainId: '0x66EEB', rpcProvider: 'https://rinkeby.arbitrum.io/rpc' },
            address: '0x9Cf54a62110d212cDFD53bde174ba52C79B6Bb47'
        }
    }
}


export const [Web3Provider,
    /*useweb3Context,*/ useConnectCalls] = constate(
        useWeb3,
        //v => v.ctx,
        v => v.connector
    );

function useWeb3() {
    //const [ctx, setCtx] = useState<ConnectCtx & { chainInfo: ChainInfo, reconnecting?:boolean }>();
    ///we will read this OFF query params when mainNet is implemented
    const contractDetails = _chains['testnet'];

    const connect = async (chainInfo: ChainInfo) => {
        const injected = new Injectedweb3();
        const r = await injected.connect(chainInfo);
        //setCtx({ ...r, chainInfo });
        return r;
    }

    const readOnly = async (chainInfo: ChainInfo) => {
        const web3ro = new Web3(chainInfo.rpcProvider);

        return {web3ro};
    }

    /*
    const disconnect = async () => {
        if (!ctx?.chainInfo)
            return;

        try{
            setCtx({...ctx,reconnecting:true});

            const injected = new Injectedweb3();
            await injected.disconnect();
            const r = await injected.connect(ctx?.chainInfo);
            setCtx({ ...r, chainInfo: ctx?.chainInfo });
   
        }catch(error:any){
            setCtx({...ctx,reconnecting:false});
            console.error(`failed to reconnect ${error}`);
        }

    }
    */

    const connector = useMemo(() => ({
        connect,
        readOnly,
        contractDetails
        //disconnect
    }), [contractDetails]);

    return { /*ctx,*/ connector };
}





export function ConnectWallet() {

    const qParams = useQueryParams();
    const { connect } = useConnectCalls();
    //const liftedCtx = useweb3Context();


    const [web3ctx, setWeb3Ctx] = useState<IAsyncResult<{
        ctx?: ConnectCtx;
    }>>({ isLoading: true });

    useEffect(() => {
        console.log('connecting wallet');

        /*
        if(liftedCtx?.reconnecting){
            console.log('wallet is reconnecting exit');
            return;
        }
        */

        let injected: any = undefined;

        if (typeof window !== "undefined") {
            injected = (window as any)?.ethereum;
        }

        if (!injected) {
            console.log("no injected provider found");
            setWeb3Ctx({ result: {} });
            return;
        }

        const usingTestnet = qParams['network'] == 'test';
        console.log(`usingTestnet = ${usingTestnet}`);

        /*
        const chainInfo = supportedChains[usingTestnet ? 1 : 0];

        (async () => {
            try {
                const ctx = await connect(chainInfo);
                setWeb3Ctx({ result: { ctx } });

            } catch (error: any) {
                setWeb3Ctx({ error });
            }

        })();
        */

    }, []);

    /*
    if (!!web3ctx.isLoading || liftedCtx?.reconnecting) {
        return <div className="p-3 d-flex ">
            <Spinner animation="border" variant="primary" />
            <span className="m-1">Waiting for wallet</span>
        </div>;
    }
    */

    if (!!web3ctx?.error) {
        return <ShowError error={web3ctx?.error} />
    }

    if (web3ctx.result && !web3ctx.result.ctx) {
        return <div className="text-center">
            <h2>No injected wallet found</h2>
            <p>We suggest installing <a href="https://metamask.io/download">Metamask</a></p>
        </div>;
    }

    return <div>ok </div>;



    /*
    return (
        <div>
          {`The current page is: ${qParams['network']||'unknown'}`}
          
        </div>
    );
    */
}
