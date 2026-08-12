import * as React from 'react';
// import styles from './HomeHeader.module.scss';
// import type { IHomeHeaderProps } from './IHomeHeaderProps';
// import { escape } from '@microsoft/sp-lodash-subset';
// import welcomeDark from '../assets/welcome-dark.png';
// import welcomeLight from '../assets/welcome-light.png';
// import {
//     Persona,
//     PersonaSize
// } from '@fluentui/react';

interface Props {
    context: any;
}

interface IUserInfo {
    displayName: string;
    jobTitle: string;
    department: string;
    mail: string;
}

const HomeHeader: React.FC<Props> = ({ context }) => {
    const [userInfo, setUserInfo] = React.useState<IUserInfo | null>(null);


    const loadUser = async (): Promise<void> => {
        const graphClient = await context.msGraphClientFactory.getClient("3");
        console.log("Graph Client:", graphClient);
        const me = await graphClient
            .api("/me")
            .select("displayName,jobTitle,department,mail")
            .get();


        setUserInfo({
            displayName: me.displayName,
            jobTitle: me.jobTitle,
            department: me.department,
            mail: me.mail
        });
    };

    React.useEffect(() => {
        void loadUser();
    }, []);

    if (!userInfo) { return <div>Loading...</div>; }

    // const user = context.pageContext.user;

    const photo =
        `${context.pageContext.web.absoluteUrl}` +
        `/_layouts/15/userphoto.aspx?size=L&accountname=${userInfo.mail}`;

    const hour = new Date().getHours();

    let greeting = "Boa noite";

    if (hour < 12)
        greeting = "Bom dia";
    else if (hour < 18)
        greeting = "Boa tarde";

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",

                width: "20%",
                minHeight: "30px",

                padding: "8px",
                gap: "18px",

                // Fundo branco translúcido
                background: "rgba(255, 255, 255, 0.5)",

                // Efeito de vidro
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",

                // Borda sutil
                border: "1px solid rgba(255, 255, 255, 0.5)",

                borderRadius: "18px",

                // Sombra mais discreta
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",

                overflow: "hidden",
                position: "relative",

                transition: "all .25s ease"
            }}
        >

            <img
                src={photo}
                alt={userInfo.displayName}
                style={{
                    width: 55,
                    height: 55,
                    borderRadius: "50%",
                    objectFit: "cover"
                }}
            />

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "1px",
                    color: "#000000ff"
                }}
            >

                <h2
                    style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: 500,
                    }}
                >
                    {greeting}, {userInfo.displayName}
                </h2>

                {/* <div
                    style={{
                        fontSize: "12px",
                        color: "#605E5C",
                    }}
                >
                    {userInfo.mail}
                </div> */}

                <div
                    style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#000000ff",
                    }}
                >
                    {userInfo.jobTitle}
                </div>

            </div>
        </div>
    );
};

export default HomeHeader;

// export default class HomeHeader extends React.Component<IHomeHeaderProps> {
//   public render(): React.ReactElement<IHomeHeaderProps> {
//     const {
//       description,
//       isDarkTheme,
//       environmentMessage,
//       userDisplayName
//     } = this.props;

//     return (
//       <section className={`${styles.homeHeader}`}>
//         <div className={styles.welcome}>
//           <img alt="" src={isDarkTheme ? welcomeDark : welcomeLight} className={styles.welcomeImage} />
//           <h2>Well done, {escape(userDisplayName)}!</h2>
//           <div>{environmentMessage}</div>
//           <div>Web part property value: <strong>{escape(description)}</strong></div>
//         </div>
//         <div>
//           <h3>Welcome to SharePoint Framework!</h3>
//           <p>
//             The SharePoint Framework (SPFx) is a extensibility model for Microsoft Viva, Microsoft Teams and SharePoint. It&#39;s the easiest way to extend Microsoft 365 with automatic Single Sign On, automatic hosting and industry standard tooling.
//           </p>
//           <h4>Learn more about SPFx development:</h4>
//           <ul className={styles.links}>
//             <li><a href="https://aka.ms/spfx" target="_blank" rel="noreferrer">SharePoint Framework Overview</a></li>
//             <li><a href="https://aka.ms/spfx-yeoman-graph" target="_blank" rel="noreferrer">Use Microsoft Graph in your solution</a></li>
//             <li><a href="https://aka.ms/spfx-yeoman-teams" target="_blank" rel="noreferrer">Build for Microsoft Teams using SharePoint Framework</a></li>
//             <li><a href="https://aka.ms/spfx-yeoman-viva" target="_blank" rel="noreferrer">Build for Microsoft Viva Connections using SharePoint Framework</a></li>
//             <li><a href="https://aka.ms/spfx-yeoman-store" target="_blank" rel="noreferrer">Publish SharePoint Framework applications to the marketplace</a></li>
//             <li><a href="https://aka.ms/spfx-yeoman-api" target="_blank" rel="noreferrer">SharePoint Framework API reference</a></li>
//             <li><a href="https://aka.ms/m365pnp" target="_blank" rel="noreferrer">Microsoft 365 Developer Community</a></li>
//           </ul>
//         </div>
//       </section>
//     );
//   }
// }
