async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const initialSupply = ethers.utils.parseUnits("1000", 18); // 1000 mUSDT
    const mockUSDT = await MockUSDT.deploy(initialSupply);

    await mockUSDT.deployed();
    console.log("MockUSDT deployed to:", mockUSDT.address);

    // Deploy FeedReward with the address of the deployed MockUSDT
    const FeedReward = await ethers.getContractFactory("FeedReward");
    const feedReward = await FeedReward.deploy(mockUSDT.address);

    await feedReward.deployed();
    console.log("FeedReward deployed to:", feedReward.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
